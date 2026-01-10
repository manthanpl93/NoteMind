"""Fixtures for conversation integration tests."""
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from bson import ObjectId
from dotenv import load_dotenv
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from database import get_database
from main import app
from utils.encryption import encrypt_api_key
from utils.password import hash_password

# Load environment variables
load_dotenv()


@pytest_asyncio.fixture
async def test_db():
    """Create a test database connection."""
    mongodb_uri = os.getenv("mongodb_uri", "mongodb://localhost:27017")
    test_db_name = os.getenv("test_database_name")
    if not test_db_name:
        pytest.skip("test_database_name environment variable not set")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client[test_db_name]
    
    yield db
    
    # Cleanup: Drop all collections after tests
    await db.users.delete_many({})
    await db.conversations.delete_many({})
    client.close()


@pytest_asyncio.fixture
async def user_with_openai_key(test_db) -> dict:
    """Create a test user with OpenAI API key configured."""
    # Get OpenAI key from environment for testing
    openai_test_key = os.getenv("OPENAI_API_KEY_TEST") or os.getenv("OPENAI_API_KEY")
    
    if not openai_test_key:
        pytest.skip("OPENAI_API_KEY_TEST or OPENAI_API_KEY not set in environment")
    
    user_data = {
        "email": f"test_user_{ObjectId()}@example.com",
        "password": hash_password("testpassword123"),
        "first_name": "Test",
        "last_name": "User",
        "api_keys": {
            "openai_api_key": encrypt_api_key(openai_test_key)
        }
    }
    
    result = await test_db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    user_data["id"] = str(result.inserted_id)
    
    return user_data


@pytest_asyncio.fixture
async def second_user_with_openai_key(test_db) -> dict:
    """Create a second test user for isolation testing."""
    openai_test_key = os.getenv("OPENAI_API_KEY_TEST") or os.getenv("OPENAI_API_KEY")
    
    if not openai_test_key:
        pytest.skip("OPENAI_API_KEY_TEST or OPENAI_API_KEY not set in environment")
    
    user_data = {
        "email": f"test_user_2_{ObjectId()}@example.com",
        "password": hash_password("testpassword123"),
        "first_name": "Test",
        "last_name": "User2",
        "api_keys": {
            "openai_api_key": encrypt_api_key(openai_test_key)
        }
    }
    
    result = await test_db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    user_data["id"] = str(result.inserted_id)
    
    return user_data


@pytest_asyncio.fixture
async def authenticated_client(user_with_openai_key, test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an authenticated HTTP client."""
    from httpx import ASGITransport
    from utils.jwt import create_access_token
    
    # Override database dependency
    async def override_get_database():
        return test_db
    
    app.dependency_overrides[get_database] = override_get_database
    
    # Create JWT token
    token = create_access_token(
        user_id=str(user_with_openai_key["_id"]),
        email=user_with_openai_key["email"]
    )
    
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
        follow_redirects=True
    ) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def second_authenticated_client(second_user_with_openai_key, test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create a second authenticated HTTP client for isolation tests."""
    from httpx import ASGITransport
    from utils.jwt import create_access_token
    
    # Override database dependency
    async def override_get_database():
        return test_db
    
    app.dependency_overrides[get_database] = override_get_database
    
    # Create JWT token
    token = create_access_token(
        user_id=str(second_user_with_openai_key["_id"]),
        email=second_user_with_openai_key["email"]
    )
    
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
        follow_redirects=True
    ) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sample_conversation(test_db, user_with_openai_key) -> dict:
    """Create a sample conversation for testing."""
    from datetime import datetime
    
    conversation_data = {
        "user_id": user_with_openai_key["_id"],
        "title": "Sample Conversation",
        "provider": "openai",
        "model_name": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, this is a test message",
                "timestamp": datetime.utcnow(),
                "tokens_used": 10
            },
            {
                "role": "assistant",
                "content": "Hello! How can I help you today?",
                "timestamp": datetime.utcnow(),
                "tokens_used": 15
            }
        ],
        "total_tokens_used": 25,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await test_db.conversations.insert_one(conversation_data)
    conversation_data["_id"] = result.inserted_id
    conversation_data["id"] = str(result.inserted_id)
    
    return conversation_data

