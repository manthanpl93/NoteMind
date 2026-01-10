from datetime import datetime
from typing import Any, Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from database import get_database
from models.folder import (
    FolderCreate,
    FolderListItem,
    FolderResponse,
    FolderUpdate,
)
from utils.auth import get_current_user

router = APIRouter(prefix="/folders", tags=["folders"])


# Database indexes to create:
# db.folders.create_index([("user_id", 1), ("name", 1)])


async def verify_folder_ownership(
    folder_id: Annotated[str, Path(description="Folder ID")],
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
) -> dict:
    """
    FastAPI dependency that verifies folder exists and user has ownership.

    Automatically:
    - Extracts folder_id from URL path
    - Validates ObjectId format
    - Fetches folder from database
    - Verifies user ownership

    Returns:
        Folder document

    Raises:
        HTTPException 404: If folder not found or invalid ID
        HTTPException 403: If user doesn't own the folder
    """
    user_id = current_user["user_id"]

    # Validate ObjectId format
    if not ObjectId.is_valid(folder_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )

    # Find folder
    folder = await db.folders.find_one({"_id": ObjectId(folder_id)})

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )

    # Verify ownership
    if folder["user_id"] != ObjectId(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this folder"
        )

    return folder


async def check_folder_name_unique(
    name: str,
    user_id: str,
    db: Any,
    exclude_folder_id: ObjectId = None
) -> bool:
    """
    Check if a folder name is unique for the user.
    Case-insensitive comparison.

    Args:
        name: Folder name to check
        user_id: User ID
        db: Database instance
        exclude_folder_id: Optional folder ID to exclude from check (for updates)

    Returns:
        True if name is unique, False otherwise
    """
    query = {
        "user_id": ObjectId(user_id),
        "name": {"$regex": f"^{name}$", "$options": "i"}  # Case-insensitive exact match
    }

    if exclude_folder_id:
        query["_id"] = {"$ne": exclude_folder_id}

    existing_folder = await db.folders.find_one(query)
    return existing_folder is None


async def validate_folder_create(
    folder: FolderCreate,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
) -> FolderCreate:
    """
    FastAPI dependency that validates folder creation data.

    Automatically:
    - Validates folder name uniqueness for the user
    - Ensures case-insensitive uniqueness

    Returns:
        Validated FolderCreate object

    Raises:
        HTTPException 409: If folder name already exists for user
    """
    user_id = current_user["user_id"]

    # Check if folder name already exists for this user
    if not await check_folder_name_unique(folder.name, user_id, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Folder with name '{folder.name}' already exists"
        )

    return folder


async def validate_folder_update(
    folder_update: FolderUpdate,
    folder: dict = Depends(verify_folder_ownership),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
) -> tuple[FolderUpdate, dict]:
    """
    FastAPI dependency that validates folder update data.

    Automatically:
    - Validates folder name uniqueness for the user (excluding current folder)
    - Ensures case-insensitive uniqueness

    Returns:
        Tuple of (validated FolderUpdate object, folder document)

    Raises:
        HTTPException 409: If folder name already exists for user
    """
    user_id = current_user["user_id"]
    folder_id = folder["_id"]

    # Check if new folder name already exists for this user (excluding current folder)
    if not await check_folder_name_unique(folder_update.name, user_id, db, folder_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Folder with name '{folder_update.name}' already exists"
        )

    return folder_update, folder


async def validate_folder_access_by_id(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
) -> ObjectId:
    """
    FastAPI dependency that validates folder access by ID.

    Similar to verify_folder_ownership but returns ObjectId instead of folder document.
    Can be used when you need the ObjectId for database operations.

    Args:
        folder_id: Folder ID string to validate

    Returns:
        ObjectId of the validated folder

    Raises:
        HTTPException 400: If folder_id format is invalid
        HTTPException 404: If folder not found
        HTTPException 403: If user doesn't own the folder
    """
    user_id = current_user["user_id"]

    # Validate ObjectId format
    if not ObjectId.is_valid(folder_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid folder_id format"
        )

    # Check if folder exists and belongs to user
    folder = await db.folders.find_one({"_id": ObjectId(folder_id)})
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )

    if folder["user_id"] != ObjectId(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this folder"
        )

    return ObjectId(folder_id)


@router.post(
    "/",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new folder",
    description="Creates a new folder for the authenticated user. "
                "Folder names must be unique per user (case-insensitive)."
)
async def create_folder(
    folder: FolderCreate = Depends(validate_folder_create),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    Create a new folder for the authenticated user.

    - **name**: Folder name (must be unique for the user)

    The API will:
    1. Validate folder name uniqueness (case-insensitive)
    2. Create the folder with timestamps
    """
    user_id = current_user["user_id"]

    # Create folder document
    now = datetime.utcnow()
    folder_doc = {
        "user_id": ObjectId(user_id),
        "name": folder.name,
        "created_at": now,
        "updated_at": now
    }

    # Insert folder into database
    result = await db.folders.insert_one(folder_doc)
    folder_id = result.inserted_id

    return FolderResponse(
        id=str(folder_id),
        user_id=user_id,
        name=folder_doc["name"],
        created_at=folder_doc["created_at"],
        updated_at=folder_doc["updated_at"]
    )


@router.get(
    "/",
    response_model=list[FolderListItem],
    summary="List user's folders",
    description="Returns a list of the user's folders sorted by creation date. "
                "Supports pagination with skip and limit parameters."
)
async def list_folders(
    skip: int = Query(default=0, ge=0, description="Number of folders to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of folders to return"),
    current_user: dict = Depends(get_current_user),
    db: Any = Depends(get_database)
):
    """
    List all folders for the authenticated user.

    Returns folders sorted by created_at (most recent first).

    - **skip**: Number of folders to skip (for pagination)
    - **limit**: Maximum number of folders to return (default 50, max 100)
    """
    user_id = current_user["user_id"]

    # Query folders for this user, sorted by created_at descending
    cursor = db.folders.find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1).skip(skip).limit(limit)

    folders = await cursor.to_list(length=limit)

    # Convert to response model
    result = []
    for folder in folders:
        result.append(FolderListItem(
            id=str(folder["_id"]),
            name=folder["name"],
            created_at=folder["created_at"],
            updated_at=folder["updated_at"]
        ))

    return result


@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
    summary="Get a folder",
    description="Retrieves a specific folder by ID."
)
async def get_folder(
    folder: dict = Depends(verify_folder_ownership)
):
    """
    Get a specific folder by ID.

    Users can only access their own folders.
    """
    # folder is already validated and fetched!
    return FolderResponse(
        id=str(folder["_id"]),
        user_id=str(folder["user_id"]),
        name=folder["name"],
        created_at=folder["created_at"],
        updated_at=folder["updated_at"]
    )


@router.patch(
    "/{folder_id}",
    response_model=FolderResponse,
    summary="Update a folder",
    description="Updates a folder's name. Folder names must be unique per user (case-insensitive)."
)
async def update_folder(
    validated_data: tuple[FolderUpdate, dict] = Depends(validate_folder_update),
    db: Any = Depends(get_database)
):
    """
    Update a folder's name.

    - **name**: New folder name (must be unique for the user)

    The API will:
    1. Validate folder name uniqueness (case-insensitive)
    2. Update the folder with new name and timestamp

    Users can only modify their own folders.
    """
    folder_update, folder = validated_data  # Unpack the tuple from dependency
    folder_id = folder["_id"]  # Already validated!

    # Update the folder
    await db.folders.update_one(
        {"_id": ObjectId(folder_id)},
        {
            "$set": {
                "name": folder_update.name,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Fetch the updated folder
    updated_folder = await db.folders.find_one({"_id": ObjectId(folder_id)})

    return FolderResponse(
        id=str(updated_folder["_id"]),
        user_id=str(updated_folder["user_id"]),
        name=updated_folder["name"],
        created_at=updated_folder["created_at"],
        updated_at=updated_folder["updated_at"]
    )


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a folder",
    description="Permanently deletes a folder. Folders can only be deleted if they contain no conversations."
)
async def delete_folder(
    folder: dict = Depends(verify_folder_ownership),
    db: Any = Depends(get_database)
):
    """
    Delete a folder.

    This is a permanent deletion. Folders can only be deleted if they contain no conversations.
    Users can only delete their own folders.
    """
    folder_id = folder["_id"]  # Already validated!

    # Check if folder has any conversations
    conversation_count = await db.conversations.count_documents({"folder_id": ObjectId(folder_id)})
    if conversation_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete folder with {conversation_count} conversation(s). Move or delete conversations first."
        )

    # Delete the folder
    await db.folders.delete_one({"_id": ObjectId(folder_id)})

    return None
