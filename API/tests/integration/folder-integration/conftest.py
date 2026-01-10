"""Fixtures for folder integration tests."""
import os
from typing import AsyncGenerator, Dict, Any
from unittest.mock import patch

import pytest
import pytest_asyncio
from bson import ObjectId
from dotenv import load_dotenv
from httpx import AsyncClient

from database import get_database
from main import app
from utils.encryption import encrypt_api_key
from utils.password import hash_password

# Load environment variables
load_dotenv()


@pytest_asyncio.fixture
async def test_db():
    """Create a test database connection using mock."""
    # Force testing mode to use mock database
    with patch.dict(os.environ, {"TESTING": "true"}):
        from database import connect_to_mongo, close_mongo_connection

        await connect_to_mongo()
        db = get_database()

        yield db

        # Cleanup: Drop all collections after tests
        await db.users.delete_many({})
        await db.folders.delete_many({})
        await db.conversations.delete_many({})
        await db.messages.delete_many({})

        await close_mongo_connection()


@pytest_asyncio.fixture
async def test_user(test_db) -> Dict[str, Any]:
    """Create a test user with API keys configured."""
    # Get API keys from environment for testing
    openai_test_key = os.getenv("OPENAI_API_KEY_TEST") or os.getenv("OPENAI_API_KEY")

    if not openai_test_key:
        pytest.skip("OPENAI_API_KEY_TEST or OPENAI_API_KEY not set in environment")

    user_data = {
        "email": f"test_user_{ObjectId()}@example.com",
        "password": hash_password("testpassword123"),
        "first_name": "Test",
        "last_name": "User",
        "api_keys": {
            "openai_api_key": encrypt_api_key(openai_test_key),
        }
    }

    result = await test_db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id

    return user_data


@pytest_asyncio.fixture
async def test_user2(test_db) -> Dict[str, Any]:
    """Create a second test user for isolation testing."""
    openai_test_key = os.getenv("OPENAI_API_KEY_TEST") or os.getenv("OPENAI_API_KEY")

    if not openai_test_key:
        pytest.skip("OPENAI_API_KEY_TEST or OPENAI_API_KEY not set in environment")

    user_data = {
        "email": f"test_user2_{ObjectId()}@example.com",
        "password": hash_password("testpassword123"),
        "first_name": "Test2",
        "last_name": "User2",
        "api_keys": {
            "openai_api_key": encrypt_api_key(openai_test_key),
        }
    }

    result = await test_db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id

    return user_data


@pytest_asyncio.fixture
async def authenticated_client(test_user: Dict[str, Any], test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an authenticated HTTP client."""
    from httpx import ASGITransport
    from utils.jwt import create_access_token

    # Override database dependency
    async def override_get_database():
        return test_db

    app.dependency_overrides[get_database] = override_get_database

    # Create JWT token for the test user
    token = create_access_token(str(test_user["_id"]), test_user["email"])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", follow_redirects=True) as client:
        # Set authorization header
        client.headers.update({"Authorization": f"Bearer {token}"})
        yield client


@pytest_asyncio.fixture
async def authenticated_client2(test_user2: Dict[str, Any], test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create a second authenticated HTTP client for isolation testing."""
    from httpx import ASGITransport
    from utils.jwt import create_access_token

    # Override database dependency
    async def override_get_database():
        return test_db

    app.dependency_overrides[get_database] = override_get_database

    # Create JWT token for the second test user
    token = create_access_token(str(test_user2["_id"]), test_user2["email"])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", follow_redirects=True) as client:
        # Set authorization header
        client.headers.update({"Authorization": f"Bearer {token}"})
        yield client


@pytest_asyncio.fixture
async def folder_factory(test_db, test_user):
    """Factory fixture for creating test folders."""

    async def create_folder(name: str, user_id: ObjectId = None) -> Dict[str, Any]:
        """Create a test folder."""
        if user_id is None:
            user_id = test_user["_id"]

        from datetime import datetime
        folder_data = {
            "user_id": user_id,
            "name": name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await test_db.folders.insert_one(folder_data)
        folder_data["_id"] = result.inserted_id

        return folder_data

    return create_folder


@pytest_asyncio.fixture
async def conversation_factory(test_db, test_user):
    """Factory fixture for creating test conversations."""

    async def create_conversation(
        first_message: str = "Test message",
        folder_id: ObjectId = None,
        user_id: ObjectId = None
    ) -> Dict[str, Any]:
        """Create a test conversation."""
        if user_id is None:
            user_id = test_user["_id"]

        from datetime import datetime
        from utils.llm import Provider, calculate_context_metrics

        conversation_data = {
            "user_id": user_id,
            "title": f"Test: {first_message[:50]}",
            "provider": Provider.OPENAI.value,
            "model_name": "gpt-4o-mini",
            "message_count": 1,
            "total_tokens_used": 0,
            **calculate_context_metrics(0, "gpt-4o-mini"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        if folder_id is not None:
            conversation_data["folder_id"] = folder_id

        result = await test_db.conversations.insert_one(conversation_data)
        conversation_data["_id"] = result.inserted_id

        # Create first message
        message_data = {
            "conversation_id": result.inserted_id,
            "user_id": user_id,
            "role": "user",
            "content": first_message,
            "timestamp": datetime.utcnow(),
            "tokens_used": 0,
            "sequence_number": 0
        }
        await test_db.messages.insert_one(message_data)

        return conversation_data

    return create_conversation
