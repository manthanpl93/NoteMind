from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Request model for creating a user."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response model for user data."""
    id: str
    email: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Response model for authentication."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class APIKeysUpdate(BaseModel):
    """Request model for updating API keys."""
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None


class APIKeysResponse(BaseModel):
    """Response model for API keys (masked for security)."""
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None


class UserInDB(BaseModel):
    """Database model for user."""
    email: str
    password: str
    first_name: str
    last_name: str
    api_keys: dict | None = None

