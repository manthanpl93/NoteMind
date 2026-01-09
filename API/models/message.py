from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Response model for a single message."""
    id: str = Field(..., description="Message ID")
    conversation_id: str = Field(..., description="ID of the conversation this message belongs to")
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="When the message was created")
    tokens_used: int = Field(..., description="Number of tokens used by this message")
    sequence_number: int = Field(..., description="Order of message in conversation (0-indexed)")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "conversation_id": "507f1f77bcf86cd799439011",
                "role": "user",
                "content": "What is Python?",
                "timestamp": "2024-01-06T12:00:00Z",
                "tokens_used": 15,
                "sequence_number": 0
            }
        }


class MessageCreate(BaseModel):
    """Request model for creating a new message."""
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., min_length=1, description="Message content")
    tokens_used: int = Field(default=0, description="Number of tokens used by this message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "What is Python?",
                "tokens_used": 0
            }
        }


class MessageUpdate(BaseModel):
    """Request model for updating a message."""
    content: str = Field(..., min_length=1, description="Updated message content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "What is Python programming language?"
            }
        }


class MessageListResponse(BaseModel):
    """Response model for paginated list of messages."""
    total: int = Field(..., description="Total number of messages in conversation")
    skip: int = Field(..., description="Number of messages skipped")
    limit: int = Field(..., description="Maximum number of messages returned")
    messages: list[MessageResponse] = Field(..., description="List of messages")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 10,
                "skip": 0,
                "limit": 50,
                "messages": [
                    {
                        "id": "507f1f77bcf86cd799439013",
                        "conversation_id": "507f1f77bcf86cd799439011",
                        "role": "user",
                        "content": "What is Python?",
                        "timestamp": "2024-01-06T12:00:00Z",
                        "tokens_used": 15,
                        "sequence_number": 0
                    }
                ]
            }
        }

