"""Fixtures for message integration tests."""
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
    client = AsyncIOMotorClient(mongodb_uri)
    db = client["test_notemind_messages"]
    
    yield db
    
    # Cleanup: Drop all collections after tests
    await db.users.delete_many({})
    await db.conversations.delete_many({})
    await db.messages.delete_many({})
    client.close()


@pytest_asyncio.fixture
async def user_with_openai_key(test_db) -> dict:
    """Create a test user with OpenAI API key configured."""
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
    
    # Cleanup
    app.dependency_overrides.clear()


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
    return user_data


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
    
    # Cleanup
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sample_conversation(test_db, user_with_openai_key) -> dict:
    """Create a sample conversation with messages for testing."""
    conversation_data = {
        "user_id": user_with_openai_key["_id"],
        "title": "Test Conversation",
        "provider": "openai",
        "model_name": "gpt-4o-mini",
        "message_count": 2,
        "total_tokens_used": 100,
        "total_context_size": 128000,
        "remaining_context_size": 127900,
        "total_used_percentage": 0.08,
        "remaining_percentage": 99.92,
    }
    
    result = await test_db.conversations.insert_one(conversation_data)
    conversation_id = result.inserted_id
    
    # Create messages
    messages = [
        {
            "conversation_id": conversation_id,
            "user_id": user_with_openai_key["_id"],
            "role": "user",
            "content": "First message",
            "timestamp": ObjectId().generation_time,
            "tokens_used": 10,
            "sequence_number": 0
        },
        {
            "conversation_id": conversation_id,
            "user_id": user_with_openai_key["_id"],
            "role": "assistant",
            "content": "First response",
            "timestamp": ObjectId().generation_time,
            "tokens_used": 20,
            "sequence_number": 1
        }
    ]
    
    await test_db.messages.insert_many(messages)
    
    conversation_data["_id"] = conversation_id
    return conversation_data

