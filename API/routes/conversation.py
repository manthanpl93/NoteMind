from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from database import get_database
from models.conversation import (
    ConversationCreate,
    ConversationCreateResponse,
    ConversationListItem,
    ConversationResponse,
    Message,
    ModelSwitchRequest,
    SendMessageRequest,
    SendMessageResponse,
)
from utils.auth import get_current_user
from utils.llm import (
    Provider,
    DEFAULT_SYSTEM_PROMPT,
    calculate_context_metrics,
    chat_with_model,
    count_messages_tokens,
    count_tokens,
    generate_title_from_message,
    get_messages_within_token_limit,
)
from utils.model_config import get_model_context_limit, get_model_info
from utils.conversation_deps import verify_conversation_ownership
from routes.folder import validate_folder_access_by_id
from typing import Optional, Tuple


async def validate_conversation_folder_access(
    conversation: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
) -> Tuple[ConversationCreate, Optional[ObjectId]]:
    """
    FastAPI dependency that validates ConversationCreate and folder access.

    Returns:
        Tuple of (conversation, folder_id) where folder_id is ObjectId if valid, None if not provided
    """
    folder_id = None
    if conversation.folder_id:
        # Use the same validation logic as verify_folder_ownership
        folder_id = await validate_folder_access_by_id(conversation.folder_id, current_user, db)

    return conversation, folder_id

router = APIRouter(prefix="/conversations", tags=["conversations"])


# Database indexes to create:
# db.conversations.create_index([("user_id", 1), ("folder_id", 1), ("updated_at", -1)])
# db.messages.create_index([("conversation_id", 1), ("sequence_number", 1)])


@router.post(
    "/",
    response_model=ConversationCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
    description="Creates a new conversation with the specified LLM provider and model. "
                "The title is automatically generated using AI from the first message. "
                "Token usage is tracked and the AI response is immediately returned."
)
async def create_conversation(
    validated_data: Tuple[ConversationCreate, Optional[ObjectId]] = Depends(validate_conversation_folder_access),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Create a new conversation with an AI model.

    - **provider**: Must be one of: openai, anthropic, google
    - **model_name**: Model identifier for the provider (e.g., gpt-4o-mini)
    - **first_message**: The initial message that starts the conversation
    - **folder_id**: Optional ID of folder to place conversation in

    The API will automatically:
    - Generate a meaningful title using GPT (max 60 characters)
    - Track token usage for the message
    - Initialize the conversation in the database
    - Validate folder ownership if folder_id provided
    """
    # Unpack validated data from dependency
    conversation, folder_id = validated_data
    user_id = current_user["user_id"]
    
    # Generate title using LLM
    try:
        title = await generate_title_from_message(
            content=conversation.first_message,
            user_id=user_id,
            provider=conversation.provider,
            db=db
        )
    except Exception as e:
        # Fallback to truncation if title generation fails
        title = conversation.first_message[:60]
        if len(conversation.first_message) > 60:
            title = title[:57] + "..."
    
    # Calculate initial context metrics
    context_metrics = calculate_context_metrics(0, conversation.model_name)
    
    # Create conversation document WITHOUT messages array
    now = datetime.utcnow()
    conversation_doc = {
        "user_id": ObjectId(user_id),
        "title": title,
        "provider": conversation.provider.value,
        "model_name": conversation.model_name,
        "message_count": 1,
        "total_tokens_used": 0,
        **context_metrics,
        "created_at": now,
        "updated_at": now
    }

    # Add folder_id if provided
    if folder_id:
        conversation_doc["folder_id"] = folder_id
    
    # Insert conversation into database
    result = await db.conversations.insert_one(conversation_doc)
    conversation_id = result.inserted_id
    
    # Get AI response for the first message
    messages_for_llm = [{"role": "user", "content": conversation.first_message}]
    try:
        ai_response_content, input_tokens, output_tokens = await chat_with_model(
            user_id=user_id,
            provider=conversation.provider,
            messages=messages_for_llm,
            db=db,
            model_name=conversation.model_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}"
        )
    
    # Insert first message into messages collection
    first_message_doc = {
        "conversation_id": conversation_id,
        "user_id": ObjectId(user_id),
        "role": "user",
        "content": conversation.first_message,
        "timestamp": now,
        "tokens_used": input_tokens,
        "sequence_number": 0
    }
    await db.messages.insert_one(first_message_doc)
    
    # Insert AI response message
    ai_timestamp = datetime.utcnow()
    ai_message_doc = {
        "conversation_id": conversation_id,
        "user_id": ObjectId(user_id),
        "role": "assistant",
        "content": ai_response_content,
        "timestamp": ai_timestamp,
        "tokens_used": output_tokens,
        "sequence_number": 1
    }
    await db.messages.insert_one(ai_message_doc)
    
    # Calculate total tokens and update conversation
    total_tokens = input_tokens + output_tokens
    context_metrics = calculate_context_metrics(total_tokens, conversation.model_name)
    
    # Update conversation document with correct message count and token usage
    await db.conversations.update_one(
        {"_id": conversation_id},
        {
            "$set": {
                "message_count": 2,
                "total_tokens_used": total_tokens,
                **context_metrics,
                "updated_at": ai_timestamp
            }
        }
    )
    
    # Update conversation_doc for response
    conversation_doc["message_count"] = 2
    conversation_doc["total_tokens_used"] = total_tokens
    conversation_doc.update(context_metrics)
    conversation_doc["updated_at"] = ai_timestamp
    
    # Create user message response object
    user_message = Message(
        role="user",
        content=conversation.first_message,
        timestamp=now,
        tokens_used=input_tokens
    )
    
    # Create AI message response object
    ai_message = Message(
        role="assistant",
        content=ai_response_content,
        timestamp=ai_timestamp,
        tokens_used=output_tokens
    )
    
    return ConversationCreateResponse(
        id=str(conversation_id),
        user_id=str(conversation_doc["user_id"]),
        title=conversation_doc["title"],
        provider=conversation_doc["provider"],
        model_name=conversation_doc["model_name"],
        message_count=conversation_doc["message_count"],
        total_tokens_used=conversation_doc["total_tokens_used"],
        total_context_size=conversation_doc["total_context_size"],
        remaining_context_size=conversation_doc["remaining_context_size"],
        total_used_percentage=conversation_doc["total_used_percentage"],
        remaining_percentage=conversation_doc["remaining_percentage"],
        folder_id=str(folder_id) if folder_id else None,
        created_at=conversation_doc["created_at"],
        updated_at=conversation_doc["updated_at"],
        messages=[user_message, ai_message]
    )


@router.get(
    "/",
    response_model=list[ConversationListItem],
    summary="List user's conversations",
    description="Returns a list of the user's conversations sorted by most recent activity. "
                "Supports pagination with skip and limit parameters. "
                "Can filter by folder_id or list conversations without folders."
)
async def list_conversations(
    skip: int = Query(default=0, ge=0, description="Number of conversations to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of conversations to return"),
    folder_id: str = Query(default=None, description="Filter by folder ID. Use 'null' to list conversations without folders"),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    List all conversations for the authenticated user.

    Returns conversations sorted by updated_at (most recent first).

    - **skip**: Number of conversations to skip (for pagination)
    - **limit**: Maximum number of conversations to return (default 50, max 100)
    - **folder_id**: Optional filter by folder ID. Use 'null' to list conversations without folders
    """
    user_id = current_user["user_id"]

    # Build query with optional folder filtering
    query = {"user_id": ObjectId(user_id)}

    if folder_id == "null":
        # Filter for conversations without folders
        query["$or"] = [
            {"folder_id": {"$exists": False}},
            {"folder_id": None}
        ]
    elif folder_id:
        # Validate folder_id format
        if not ObjectId.is_valid(folder_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid folder_id format"
            )
        # Filter for specific folder and verify ownership
        folder = await db.folders.find_one({"_id": ObjectId(folder_id)})
        if folder and folder["user_id"] != ObjectId(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this folder"
            )
        query["folder_id"] = ObjectId(folder_id)

    # Query conversations for this user, sorted by updated_at descending
    cursor = db.conversations.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    
    conversations = await cursor.to_list(length=limit)
    
    # Convert to response model
    result = []
    for conv in conversations:
        result.append(ConversationListItem(
            id=str(conv["_id"]),
            title=conv["title"],
            provider=conv["provider"],
            model_name=conv["model_name"],
            message_count=conv.get("message_count", 0),
            total_tokens_used=conv.get("total_tokens_used", 0),
            total_context_size=conv.get("total_context_size", 0),
            remaining_context_size=conv.get("remaining_context_size", 0),
            total_used_percentage=conv.get("total_used_percentage", 0.0),
            remaining_percentage=conv.get("remaining_percentage", 100.0),
            folder_id=str(conv["folder_id"]) if conv.get("folder_id") else None,
            created_at=conv["created_at"],
            updated_at=conv["updated_at"]
        ))
    
    return result


@router.get(
    "/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get a conversation",
    description="Retrieves the complete conversation including all messages and metadata."
)
async def get_conversation(
    conversation: dict = Depends(verify_conversation_ownership)
):
    """
    Get a specific conversation by ID.

    Returns the complete conversation with full message history.
    Users can only access their own conversations.
    """
    # conversation is already validated and fetched!
    return ConversationResponse(
        id=str(conversation["_id"]),
        user_id=str(conversation["user_id"]),
        title=conversation["title"],
        provider=conversation["provider"],
        model_name=conversation["model_name"],
        message_count=conversation.get("message_count", 0),
        total_tokens_used=conversation.get("total_tokens_used", 0),
        total_context_size=conversation.get("total_context_size", 0),
        remaining_context_size=conversation.get("remaining_context_size", 0),
        total_used_percentage=conversation.get("total_used_percentage", 0.0),
        remaining_percentage=conversation.get("remaining_percentage", 100.0),
        folder_id=str(conversation["folder_id"]) if conversation.get("folder_id") else None,
        created_at=conversation["created_at"],
        updated_at=conversation["updated_at"]
    )


@router.post(
    "/{conversation_id}/messages",
    response_model=SendMessageResponse,
    summary="Send a message",
    description="Send a message to the conversation and receive an AI response. "
                "Supports token-based context limiting to control conversation history sent to the model."
)
async def send_message(
    request: SendMessageRequest,
    conversation: dict = Depends(verify_conversation_ownership),
    current_user: dict = Depends(get_current_user),  # Still needed for user_id
    db: Any = Depends(get_database)  # Still needed for messages
):
    """
    Send a message to an existing conversation and get an AI response.

    - **content**: The message content to send
    - **context_limit_tokens**: Maximum tokens from conversation history to include (default: 4000)

    The API will:
    1. Add your message to the conversation
    2. Load recent messages within the token limit
    3. Send to the AI model
    4. Save the AI's response
    5. Update token usage and timestamps
    """
    user_id = current_user["user_id"]
    conversation_id = conversation["_id"]  # Already validated!
    
    # Get current message count to determine sequence numbers
    current_message_count = conversation.get("message_count", 0)
    user_sequence = current_message_count
    ai_sequence = current_message_count + 1
    
    # Fetch all existing messages for context limiting
    messages_cursor = db.messages.find(
        {"conversation_id": ObjectId(conversation_id)}
    ).sort("sequence_number", 1)
    existing_messages = await messages_cursor.to_list(length=None)
    
    # Convert to format for token calculation
    messages_for_token_calc = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in existing_messages
    ]
    
    # Add the new user message for token calculation
    messages_for_token_calc.append({
        "role": "user",
        "content": request.content
    })
    
    # Reserve tokens for system prompt (approximately 200 tokens)
    # This ensures the system prompt doesn't push us over the limit
    SYSTEM_PROMPT_TOKEN_RESERVE = 200
    effective_token_limit = max(0, request.context_limit_tokens - SYSTEM_PROMPT_TOKEN_RESERVE)
    
    # Apply token-based context limiting
    messages_for_llm = get_messages_within_token_limit(
        messages_for_token_calc,
        effective_token_limit,
        conversation["model_name"]
    )
    
    # Get AI response with actual token usage
    now = datetime.utcnow()
    try:
        ai_response_content, input_tokens, output_tokens = await chat_with_model(
            user_id=user_id,
            provider=Provider(conversation["provider"]),
            messages=messages_for_llm,
            db=db,
            model_name=conversation["model_name"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}"
        )
    
    # Insert user message into messages collection
    user_message_doc = {
        "conversation_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id),
        "role": "user",
        "content": request.content,
        "timestamp": now,
        "tokens_used": input_tokens,
        "sequence_number": user_sequence
    }
    await db.messages.insert_one(user_message_doc)
    
    # Insert AI message into messages collection
    ai_timestamp = datetime.utcnow()
    ai_message_doc = {
        "conversation_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id),
        "role": "assistant",
        "content": ai_response_content,
        "timestamp": ai_timestamp,
        "tokens_used": output_tokens,
        "sequence_number": ai_sequence
    }
    await db.messages.insert_one(ai_message_doc)
    
    # Calculate new total and context metrics
    new_total_tokens = conversation["total_tokens_used"] + input_tokens + output_tokens
    context_metrics = calculate_context_metrics(new_total_tokens, conversation["model_name"])
    
    # Update conversation: increment message_count by 2, update tokens, timestamps
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "message_count": current_message_count + 2,
                "total_tokens_used": new_total_tokens,
                **context_metrics,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get final updated conversation
    updated_conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    
    conversation_response = ConversationResponse(
        id=str(updated_conversation["_id"]),
        user_id=str(updated_conversation["user_id"]),
        title=updated_conversation["title"],
        provider=updated_conversation["provider"],
        model_name=updated_conversation["model_name"],
        message_count=updated_conversation.get("message_count", 0),
        total_tokens_used=updated_conversation.get("total_tokens_used", 0),
        total_context_size=updated_conversation.get("total_context_size", 0),
        remaining_context_size=updated_conversation.get("remaining_context_size", 0),
        total_used_percentage=updated_conversation.get("total_used_percentage", 0.0),
        remaining_percentage=updated_conversation.get("remaining_percentage", 100.0),
        folder_id=str(updated_conversation["folder_id"]) if updated_conversation.get("folder_id") else None,
        created_at=updated_conversation["created_at"],
        updated_at=updated_conversation["updated_at"]
    )
    
    # Create AI message response model
    ai_message = Message(
        role=ai_message_doc["role"],
        content=ai_message_doc["content"],
        timestamp=ai_message_doc["timestamp"],
        tokens_used=ai_message_doc["tokens_used"]
    )
    
    return SendMessageResponse(
        message=ai_message,
        conversation=conversation_response
    )


@router.patch(
    "/{conversation_id}/model",
    response_model=ConversationResponse,
    summary="Switch the model for a conversation",
    description="Switches the language model used in a conversation. "
                "Automatically recalculates context limits and percentages based on the new model's capabilities."
)
async def switch_conversation_model(
    request: ModelSwitchRequest,
    conversation: dict = Depends(verify_conversation_ownership),
    db: Any = Depends(get_database)  # Still needed for updates
):
    """
    Switch the model used in an existing conversation.

    - **model**: New model name to switch to (must be a valid model name)

    The API will:
    1. Validate the model name is supported
    2. Update the conversation's model
    3. Recalculate context limits and percentages based on the new model
    4. Update the conversation's timestamp

    Users can only modify their own conversations.
    """
    conversation_id = conversation["_id"]  # Already validated!

    # Validate the new model name
    model_info = get_model_info(request.model)
    if not model_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid model name: {request.model}"
        )

    # Get the new context limit
    new_context_limit = get_model_context_limit(request.model)
    total_tokens_used = conversation.get("total_tokens_used", 0)

    # Calculate updated context metrics
    remaining_context_size = new_context_limit - total_tokens_used
    total_used_percentage = (total_tokens_used / new_context_limit) * 100 if new_context_limit > 0 else 0
    remaining_percentage = 100 - total_used_percentage

    # Update the conversation
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "model_name": request.model,
                "total_context_size": new_context_limit,
                "remaining_context_size": remaining_context_size,
                "total_used_percentage": total_used_percentage,
                "remaining_percentage": remaining_percentage,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Fetch the updated conversation
    updated_conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})

    return ConversationResponse(
        id=str(updated_conversation["_id"]),
        user_id=str(updated_conversation["user_id"]),
        title=updated_conversation["title"],
        provider=updated_conversation["provider"],
        model_name=updated_conversation["model_name"],
        message_count=updated_conversation.get("message_count", 0),
        total_tokens_used=updated_conversation.get("total_tokens_used", 0),
        total_context_size=updated_conversation.get("total_context_size", 0),
        remaining_context_size=updated_conversation.get("remaining_context_size", 0),
        total_used_percentage=updated_conversation.get("total_used_percentage", 0.0),
        remaining_percentage=updated_conversation.get("remaining_percentage", 100.0),
        folder_id=str(updated_conversation["folder_id"]) if updated_conversation.get("folder_id") else None,
        created_at=updated_conversation["created_at"],
        updated_at=updated_conversation["updated_at"]
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
    description="Permanently deletes a conversation and all its messages."
)
async def delete_conversation(
    conversation: dict = Depends(verify_conversation_ownership),
    db: Any = Depends(get_database)  # Still needed for deletion
):
    """
    Delete a conversation.

    This is a permanent deletion - the conversation and all its messages will be removed.
    Users can only delete their own conversations.
    """
    conversation_id = conversation["_id"]  # Already validated!

    # Cascade delete: Delete all messages for this conversation
    await db.messages.delete_many({"conversation_id": ObjectId(conversation_id)})

    # Delete the conversation
    await db.conversations.delete_one({"_id": ObjectId(conversation_id)})

    return None


