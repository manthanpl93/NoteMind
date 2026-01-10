from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    """Request model for creating a new folder."""
    name: str = Field(..., min_length=1, max_length=100, description="Folder name (unique per user)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Work Projects"
            }
        }


class FolderUpdate(BaseModel):
    """Request model for updating a folder."""
    name: str = Field(..., min_length=1, max_length=100, description="New folder name (unique per user)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated Work Projects"
            }
        }


class FolderResponse(BaseModel):
    """Response model for a complete folder."""
    id: str = Field(..., description="Folder ID")
    user_id: str = Field(..., description="ID of the user who owns this folder")
    name: str = Field(..., description="Folder name")
    created_at: datetime = Field(..., description="When the folder was created")
    updated_at: datetime = Field(..., description="When the folder was last updated")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "name": "Work Projects",
                "created_at": "2024-01-06T12:00:00Z",
                "updated_at": "2024-01-06T12:00:00Z"
            }
        }


class FolderListItem(BaseModel):
    """Response model for folder in list view."""
    id: str = Field(..., description="Folder ID")
    name: str = Field(..., description="Folder name")
    created_at: datetime = Field(..., description="When the folder was created")
    updated_at: datetime = Field(..., description="When the folder was last updated")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Work Projects",
                "created_at": "2024-01-06T12:00:00Z",
                "updated_at": "2024-01-06T12:00:00Z"
            }
        }
