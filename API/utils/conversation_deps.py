from typing import Annotated, Any
from bson import ObjectId
from fastapi import Depends, HTTPException, Path, status
from database import get_database
from utils.auth import get_current_user


async def verify_conversation_ownership(
    conversation_id: Annotated[str, Path(description="Conversation ID")],
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
) -> dict:
    """
    FastAPI dependency that verifies conversation exists and user has ownership.

    Automatically:
    - Extracts conversation_id from URL path
    - Validates ObjectId format
    - Fetches conversation from database
    - Verifies user ownership

    Returns:
        Conversation document

    Raises:
        HTTPException 404: If conversation not found or invalid ID
        HTTPException 403: If user doesn't own the conversation
    """
    user_id = current_user["user_id"]

    # Validate ObjectId format
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Find conversation
    conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Verify ownership
    if conversation["user_id"] != ObjectId(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this conversation"
        )

    return conversation
