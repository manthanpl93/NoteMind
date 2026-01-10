"""Fixtures for models integration tests."""
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
    client.close()


@pytest_asyncio.fixture
async def test_user(test_db) -> dict:
    """Create a test user for authentication."""
    user_data = {
        "email": f"test_user_{ObjectId()}@example.com",
        "password": hash_password("testpassword123"),
        "first_name": "Test",
        "last_name": "User",
    }

    result = await test_db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    user_data["id"] = str(result.inserted_id)

    return user_data


@pytest_asyncio.fixture
async def authenticated_client(test_user, test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an authenticated HTTP client."""
    from httpx import ASGITransport
    from utils.jwt import create_access_token

    # Override database dependency
    async def override_get_database():
        return test_db

    app.dependency_overrides[get_database] = override_get_database

    # Create JWT token
    token = create_access_token(
        user_id=str(test_user["_id"]),
        email=test_user["email"]
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
async def unauthenticated_client(test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an unauthenticated HTTP client."""
    from httpx import ASGITransport

    # Override database dependency
    async def override_get_database():
        return test_db

    app.dependency_overrides[get_database] = override_get_database

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        follow_redirects=True
    ) as client:
        yield client

    # Cleanup
    app.dependency_overrides.clear()
