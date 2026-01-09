import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from database import settings


# JWT Configuration
JWT_SECRET = settings.jwt_secret if hasattr(settings, 'jwt_secret') else "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """Extract user ID from token."""
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None

