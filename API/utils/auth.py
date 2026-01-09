from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt import verify_token

# Security scheme for JWT Bearer tokens
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Dependency to get the current authenticated user from JWT token."""
    token = credentials.credentials
    
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
    }


async def get_current_user_id(
    current_user: dict = Depends(get_current_user)
) -> str:
    """Dependency to get just the current user's ID."""
    return current_user["user_id"]

