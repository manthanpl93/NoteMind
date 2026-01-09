from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from database import get_database
from models.conversation import (
    ConversationCreate,
    ConversationListItem,
    ConversationResponse,
    Message,
    SendMessageRequest,
    SendMessageResponse,
)
from utils.auth import get_current_user
from utils.llm import (
    Provider,
    calculate_context_metrics,
    chat_with_model,
    count_messages_tokens,
    count_tokens,
    generate_title_from_message,
    get_messages_within_token_limit,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


# Database indexes to create:
# db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
# db.conversations.create_index([("user_id", 1), ("_id", 1)])


@router.post(
    "/",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
    description="Creates a new conversation with the specified LLM provider and model. "
                "The title is automatically generated using AI from the first message. "
                "Token usage is tracked for the initial message."
)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Create a new conversation with an AI model.
    
    - **provider**: Must be one of: openai, anthropic, google
    - **model_name**: Model identifier for the provider (e.g., gpt-4o-mini)
    - **first_message**: The initial message that starts the conversation
    
    The API will automatically:
    - Generate a meaningful title using GPT (max 60 characters)
    - Track token usage for the message
    - Initialize the conversation in the database
    """
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
    
    # Initial message (no tokens yet - no AI response)
    now = datetime.utcnow()
    first_message = {
        "role": "user",
        "content": conversation.first_message,
        "timestamp": now,
        "tokens_used": 0
    }
    
    # Calculate initial context metrics
    context_metrics = calculate_context_metrics(0, conversation.model_name)
    
    # Create conversation document
    conversation_doc = {
        "user_id": ObjectId(user_id),
        "title": title,
        "provider": conversation.provider.value,
        "model_name": conversation.model_name,
        "messages": [first_message],
        "total_tokens_used": 0,
        **context_metrics,
        "created_at": now,
        "updated_at": now
    }
    
    # Insert into database
    result = await db.conversations.insert_one(conversation_doc)
    conversation_doc["_id"] = result.inserted_id
    
    # Convert to response model
    return ConversationResponse(
        id=str(conversation_doc["_id"]),
        user_id=str(conversation_doc["user_id"]),
        title=conversation_doc["title"],
        provider=conversation_doc["provider"],
        model_name=conversation_doc["model_name"],
        messages=[Message(**first_message)],
        total_tokens_used=conversation_doc["total_tokens_used"],
        total_context_size=conversation_doc["total_context_size"],
        remaining_context_size=conversation_doc["remaining_context_size"],
        total_used_percentage=conversation_doc["total_used_percentage"],
        remaining_percentage=conversation_doc["remaining_percentage"],
        created_at=conversation_doc["created_at"],
        updated_at=conversation_doc["updated_at"]
    )


@router.get(
    "/",
    response_model=list[ConversationListItem],
    summary="List user's conversations",
    description="Returns a list of the user's conversations sorted by most recent activity. "
                "Supports pagination with skip and limit parameters."
)
async def list_conversations(
    skip: int = Query(default=0, ge=0, description="Number of conversations to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of conversations to return"),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    List all conversations for the authenticated user.
    
    Returns conversations sorted by updated_at (most recent first).
    
    - **skip**: Number of conversations to skip (for pagination)
    - **limit**: Maximum number of conversations to return (default 50, max 100)
    """
    user_id = current_user["user_id"]
    
    # Query conversations for this user, sorted by updated_at descending
    cursor = db.conversations.find(
        {"user_id": ObjectId(user_id)}
    ).sort("updated_at", -1).skip(skip).limit(limit)
    
    conversations = await cursor.to_list(length=limit)
    
    # Convert to response model
    result = []
    for conv in conversations:
        result.append(ConversationListItem(
            id=str(conv["_id"]),
            title=conv["title"],
            provider=conv["provider"],
            model_name=conv["model_name"],
            message_count=len(conv.get("messages", [])),
            total_tokens_used=conv.get("total_tokens_used", 0),
            total_context_size=conv.get("total_context_size", 0),
            remaining_context_size=conv.get("remaining_context_size", 0),
            total_used_percentage=conv.get("total_used_percentage", 0.0),
            remaining_percentage=conv.get("remaining_percentage", 100.0),
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
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Get a specific conversation by ID.
    
    Returns the complete conversation with full message history.
    Users can only access their own conversations.
    """
    user_id = current_user["user_id"]
    
    # Validate ObjectId format
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Find conversation
    conversation = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Convert messages to Message models
    messages = [Message(**msg) for msg in conversation.get("messages", [])]
    
    return ConversationResponse(
        id=str(conversation["_id"]),
        user_id=str(conversation["user_id"]),
        title=conversation["title"],
        provider=conversation["provider"],
        model_name=conversation["model_name"],
        messages=messages,
        total_tokens_used=conversation.get("total_tokens_used", 0),
        total_context_size=conversation.get("total_context_size", 0),
        remaining_context_size=conversation.get("remaining_context_size", 0),
        total_used_percentage=conversation.get("total_used_percentage", 0.0),
        remaining_percentage=conversation.get("remaining_percentage", 100.0),
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
    conversation_id: str,
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
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
    
    # Validate ObjectId format
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Find conversation and verify ownership
    conversation = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this conversation"
        )
    
    # Create user message (tokens will be counted by API)
    now = datetime.utcnow()
    user_message = {
        "role": "user",
        "content": request.content,
        "timestamp": now,
        "tokens_used": 0  # Will be updated with actual API tokens
    }
    
    # Add user message to conversation temporarily
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"messages": user_message}}
    )
    
    # Get updated conversation with new user message
    conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    messages = conversation.get("messages", [])
    
    # Apply token-based context limiting
    # Get messages within token limit for sending to LLM
    messages_for_llm = get_messages_within_token_limit(
        messages,
        request.context_limit_tokens,
        conversation["model_name"]
    )
    
    # Convert to format expected by chat_with_model
    messages_for_api = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in messages_for_llm
    ]
    
    # Get AI response with actual token usage
    try:
        ai_response_content, input_tokens, output_tokens = await chat_with_model(
            user_id=user_id,
            provider=Provider(conversation["provider"]),
            messages=messages_for_api,
            db=db,
            model_name=conversation["model_name"]
        )
    except Exception as e:
        # Rollback: remove the user message if AI call fails
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$pop": {"messages": 1}}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}"
        )
    
    # Update user message with actual input tokens
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id), "messages.timestamp": now},
        {"$set": {"messages.$.tokens_used": input_tokens}}
    )
    
    # Create AI message with actual output tokens
    ai_message = {
        "role": "assistant",
        "content": ai_response_content,
        "timestamp": datetime.utcnow(),
        "tokens_used": output_tokens
    }
    
    # Calculate new total and context metrics
    new_total_tokens = conversation["total_tokens_used"] + input_tokens + output_tokens
    context_metrics = calculate_context_metrics(new_total_tokens, conversation["model_name"])
    
    # Add AI message and update conversation with context metrics
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$push": {"messages": ai_message},
            "$set": {
                "total_tokens_used": new_total_tokens,
                **context_metrics,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get final updated conversation
    updated_conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    
    # Convert to response models
    messages = [Message(**msg) for msg in updated_conversation.get("messages", [])]
    
    conversation_response = ConversationResponse(
        id=str(updated_conversation["_id"]),
        user_id=str(updated_conversation["user_id"]),
        title=updated_conversation["title"],
        provider=updated_conversation["provider"],
        model_name=updated_conversation["model_name"],
        messages=messages,
        total_tokens_used=updated_conversation.get("total_tokens_used", 0),
        total_context_size=updated_conversation.get("total_context_size", 0),
        remaining_context_size=updated_conversation.get("remaining_context_size", 0),
        total_used_percentage=updated_conversation.get("total_used_percentage", 0.0),
        remaining_percentage=updated_conversation.get("remaining_percentage", 100.0),
        created_at=updated_conversation["created_at"],
        updated_at=updated_conversation["updated_at"]
    )
    
    return SendMessageResponse(
        message=Message(**ai_message),
        conversation=conversation_response
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
    description="Permanently deletes a conversation and all its messages."
)
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Delete a conversation.
    
    This is a permanent deletion - the conversation and all its messages will be removed.
    Users can only delete their own conversations.
    """
    user_id = current_user["user_id"]
    
    # Validate ObjectId format
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Find conversation to verify ownership
    conversation = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        # Check if conversation exists at all
        exists = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this conversation"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
    
    # Delete the conversation
    await db.conversations.delete_one({"_id": ObjectId(conversation_id)})
    
    return None


