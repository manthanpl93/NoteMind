from typing import Any, Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from database import get_database
from models.message import (
    MessageListResponse,
    MessageResponse,
    MessageUpdate,
)
from utils.auth import get_current_user

# Router for conversation-specific message endpoints
conversation_message_router = APIRouter(prefix="/conversations", tags=["messages"])

# Router for individual message endpoints
message_router = APIRouter(prefix="/messages", tags=["messages"])


@conversation_message_router.get(
    "/{conversation_id}/messages",
    response_model=MessageListResponse,
    summary="Get paginated messages",
    description="Retrieve messages for a conversation with pagination support. "
                "Messages are ordered by sequence_number by default."
)
async def get_conversation_messages(
    conversation_id: str,
    skip: int = Query(default=0, ge=0, description="Number of messages to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of messages to return"),
    order: Literal["asc", "desc"] = Query(default="asc", description="Sort order: asc (oldest first) or desc (newest first)"),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Get paginated messages for a conversation.
    
    - **conversation_id**: ID of the conversation
    - **skip**: Number of messages to skip (for pagination)
    - **limit**: Maximum number of messages to return (default 50, max 100)
    - **order**: Sort order - "asc" for oldest first, "desc" for newest first
    
    Users can only access messages from their own conversations.
    """
    user_id = current_user["user_id"]
    
    # Validate ObjectId format
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user owns the conversation
    conversation = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get total count of messages
    total = await db.messages.count_documents({"conversation_id": ObjectId(conversation_id)})
    
    # Fetch messages with pagination
    sort_order = 1 if order == "asc" else -1
    cursor = db.messages.find(
        {"conversation_id": ObjectId(conversation_id)}
    ).sort("sequence_number", sort_order).skip(skip).limit(limit)
    
    messages_docs = await cursor.to_list(length=limit)
    
    # Convert to response models
    messages = [
        MessageResponse(
            id=str(msg["_id"]),
            conversation_id=str(msg["conversation_id"]),
            role=msg["role"],
            content=msg["content"],
            timestamp=msg["timestamp"],
            tokens_used=msg["tokens_used"],
            sequence_number=msg["sequence_number"]
        )
        for msg in messages_docs
    ]
    
    return MessageListResponse(
        total=total,
        skip=skip,
        limit=limit,
        messages=messages
    )


@message_router.get(
    "/{message_id}",
    response_model=MessageResponse,
    summary="Get a single message",
    description="Retrieve details of a specific message by ID."
)
async def get_message(
    message_id: str,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Get a specific message by ID.
    
    Users can only access messages from their own conversations.
    """
    user_id = current_user["user_id"]
    
    # Validate ObjectId format
    if not ObjectId.is_valid(message_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Find message
    message = await db.messages.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify user owns the conversation
    conversation = await db.conversations.find_one({
        "_id": message["conversation_id"],
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this message"
        )
    
    return MessageResponse(
        id=str(message["_id"]),
        conversation_id=str(message["conversation_id"]),
        role=message["role"],
        content=message["content"],
        timestamp=message["timestamp"],
        tokens_used=message["tokens_used"],
        sequence_number=message["sequence_number"]
    )


@message_router.patch(
    "/{message_id}",
    response_model=MessageResponse,
    summary="Edit a message",
    description="Update the content of a message. Only user messages can be edited, not assistant messages."
)
async def update_message(
    message_id: str,
    update: MessageUpdate,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Edit a message's content.
    
    - Only user messages can be edited (not assistant or system messages)
    - Users can only edit messages from their own conversations
    
    - **content**: Updated message content
    """
    user_id = current_user["user_id"]
    
    # Validate ObjectId format
    if not ObjectId.is_valid(message_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Find message
    message = await db.messages.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify user owns the conversation
    conversation = await db.conversations.find_one({
        "_id": message["conversation_id"],
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this message"
        )
    
    # Only allow editing user messages
    if message["role"] != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only user messages can be edited"
        )
    
    # Update message content
    await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"content": update.content}}
    )
    
    # Fetch updated message
    updated_message = await db.messages.find_one({"_id": ObjectId(message_id)})
    
    return MessageResponse(
        id=str(updated_message["_id"]),
        conversation_id=str(updated_message["conversation_id"]),
        role=updated_message["role"],
        content=updated_message["content"],
        timestamp=updated_message["timestamp"],
        tokens_used=updated_message["tokens_used"],
        sequence_number=updated_message["sequence_number"]
    )


@message_router.delete(
    "/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a message",
    description="Permanently delete a message from a conversation. "
                "The conversation's message_count will be decremented."
)
async def delete_message(
    message_id: str,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Delete a message.
    
    This is a permanent deletion. The conversation's message_count will be decremented.
    Users can only delete messages from their own conversations.
    """
    user_id = current_user["user_id"]
    
    # Validate ObjectId format
    if not ObjectId.is_valid(message_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Find message
    message = await db.messages.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    conversation_id = message["conversation_id"]
    
    # Verify user owns the conversation
    conversation = await db.conversations.find_one({
        "_id": conversation_id,
        "user_id": ObjectId(user_id)
    })
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this message"
        )
    
    # Delete the message
    await db.messages.delete_one({"_id": ObjectId(message_id)})
    
    # Decrement conversation message_count
    current_count = conversation.get("message_count", 0)
    if current_count > 0:
        await db.conversations.update_one(
            {"_id": conversation_id},
            {"$set": {"message_count": current_count - 1}}
        )
    
    return None

