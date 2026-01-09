from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from models.user import UserCreate, UserLogin, UserResponse, UserInDB, AuthResponse, APIKeysUpdate, APIKeysResponse
from database import get_database
from utils.password import hash_password, verify_password
from utils.jwt import create_access_token
from utils.auth import get_current_user
from utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create a new user account and return JWT token."""
    db = get_database()
    
    # Check if user with email already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Hash the password before storing
    hashed_password = hash_password(user.password)
    
    # Create user document
    user_dict = UserInDB(
        email=user.email,
        password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    ).model_dump()
    
    # Insert into database
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create JWT token
    access_token = create_access_token(user_id, user.email)
    
    # Return auth response with token
    return AuthResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login_user(credentials: UserLogin):
    """Authenticate a user and return JWT token."""
    db = get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user_id = str(user["_id"])
    
    # Create JWT token
    access_token = create_access_token(user_id, user["email"])
    
    # Return auth response with token
    return AuthResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"]
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    db = get_database()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"]
    )


@router.put("/api-keys", response_model=APIKeysResponse)
async def update_api_keys(keys: APIKeysUpdate, current_user: dict = Depends(get_current_user)):
    """Update the current user's API keys (encrypted storage)."""
    db = get_database()
    user_id = ObjectId(current_user["user_id"])
    
    # Get existing user
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get existing api_keys or empty dict
    existing_keys = user.get("api_keys", {}) or {}
    
    # Update only the keys that are provided (not None)
    update_data = {}
    if keys.openai_api_key is not None:
        update_data["openai_api_key"] = encrypt_api_key(keys.openai_api_key) if keys.openai_api_key else ""
    if keys.anthropic_api_key is not None:
        update_data["anthropic_api_key"] = encrypt_api_key(keys.anthropic_api_key) if keys.anthropic_api_key else ""
    if keys.google_api_key is not None:
        update_data["google_api_key"] = encrypt_api_key(keys.google_api_key) if keys.google_api_key else ""
    
    # Merge with existing keys
    new_keys = {**existing_keys, **update_data}
    
    # Update user document
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"api_keys": new_keys}}
    )
    
    # Return masked keys
    return APIKeysResponse(
        openai_api_key=mask_api_key(decrypt_api_key(new_keys.get("openai_api_key", ""))) if new_keys.get("openai_api_key") else None,
        anthropic_api_key=mask_api_key(decrypt_api_key(new_keys.get("anthropic_api_key", ""))) if new_keys.get("anthropic_api_key") else None,
        google_api_key=mask_api_key(decrypt_api_key(new_keys.get("google_api_key", ""))) if new_keys.get("google_api_key") else None
    )


@router.get("/api-keys", response_model=APIKeysResponse)
async def get_api_keys(current_user: dict = Depends(get_current_user)):
    """Get the current user's API keys (masked for security)."""
    db = get_database()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    api_keys = user.get("api_keys", {}) or {}
    
    # Return masked keys
    return APIKeysResponse(
        openai_api_key=mask_api_key(decrypt_api_key(api_keys.get("openai_api_key", ""))) if api_keys.get("openai_api_key") else None,
        anthropic_api_key=mask_api_key(decrypt_api_key(api_keys.get("anthropic_api_key", ""))) if api_keys.get("anthropic_api_key") else None,
        google_api_key=mask_api_key(decrypt_api_key(api_keys.get("google_api_key", ""))) if api_keys.get("google_api_key") else None
    )
