from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from utils.llm import Provider


class Message(BaseModel):
    """Model for a single message in a conversation."""
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the message was created")
    tokens_used: int = Field(default=0, description="Number of tokens used by this message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "What is Python?",
                "timestamp": "2024-01-06T12:00:00Z",
                "tokens_used": 15
            }
        }


class ConversationCreate(BaseModel):
    """Request model for creating a new conversation."""
    provider: Provider = Field(..., description="LLM provider (openai, anthropic, google)")
    model_name: str = Field(..., description="Specific model name to use")
    first_message: str = Field(..., min_length=1, description="The initial message to start the conversation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Explain quantum computing in simple terms"
            }
        }


class ConversationResponse(BaseModel):
    """Response model for a complete conversation."""
    id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="ID of the user who owns this conversation")
    title: str = Field(..., description="Auto-generated conversation title")
    provider: str = Field(..., description="LLM provider used")
    model_name: str = Field(..., description="Model name used")
    message_count: int = Field(..., description="Number of messages in conversation")
    total_tokens_used: int = Field(..., description="Total tokens used across all messages")
    total_context_size: int = Field(..., description="Maximum context window for the model")
    remaining_context_size: int = Field(..., description="Remaining tokens available")
    total_used_percentage: float = Field(..., description="Percentage of context used (0-100)")
    remaining_percentage: float = Field(..., description="Percentage of context remaining (0-100)")
    created_at: datetime = Field(..., description="When the conversation was created")
    updated_at: datetime = Field(..., description="When the conversation was last updated")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "title": "Understanding Quantum Computing",
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "message_count": 1,
                "total_tokens_used": 150,
                "total_context_size": 128000,
                "remaining_context_size": 127850,
                "total_used_percentage": 0.12,
                "remaining_percentage": 99.88,
                "created_at": "2024-01-06T12:00:00Z",
                "updated_at": "2024-01-06T12:05:00Z"
            }
        }


class ConversationListItem(BaseModel):
    """Response model for conversation in list view (without full messages)."""
    id: str = Field(..., description="Conversation ID")
    title: str = Field(..., description="Conversation title")
    provider: str = Field(..., description="LLM provider")
    model_name: str = Field(..., description="Model name")
    message_count: int = Field(..., description="Number of messages in conversation")
    total_tokens_used: int = Field(..., description="Total tokens used")
    total_context_size: int = Field(..., description="Maximum context window")
    remaining_context_size: int = Field(..., description="Remaining tokens available")
    total_used_percentage: float = Field(..., description="Percentage of context used")
    remaining_percentage: float = Field(..., description="Percentage of context remaining")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "title": "Understanding Quantum Computing",
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "message_count": 12,
                "total_tokens_used": 1543,
                "total_context_size": 128000,
                "remaining_context_size": 126457,
                "total_used_percentage": 1.21,
                "remaining_percentage": 98.79,
                "created_at": "2024-01-06T12:00:00Z",
                "updated_at": "2024-01-06T12:30:00Z"
            }
        }


class SendMessageRequest(BaseModel):
    """Request model for sending a message to a conversation."""
    content: str = Field(..., min_length=1, description="The message content to send")
    context_limit_tokens: Optional[int] = Field(
        default=4000,
        ge=100,
        le=200000,
        description="Maximum tokens to include from conversation history (default: 4000)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Can you give an example?",
                "context_limit_tokens": 4000
            }
        }


class SendMessageResponse(BaseModel):
    """Response model for sending a message."""
    message: Message = Field(..., description="The AI's response message")
    conversation: ConversationResponse = Field(..., description="Updated conversation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": {
                    "role": "assistant",
                    "content": "Sure! Here's an example...",
                    "timestamp": "2024-01-06T12:05:00Z",
                    "tokens_used": 45
                },
                "conversation": {
                    "id": "507f1f77bcf86cd799439011",
                    "title": "Understanding Quantum Computing",
                    "provider": "openai",
                    "model_name": "gpt-4o-mini",
                    "total_tokens_used": 195,
                    "created_at": "2024-01-06T12:00:00Z",
                    "updated_at": "2024-01-06T12:05:00Z"
                }
            }
        }


