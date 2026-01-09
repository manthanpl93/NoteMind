"""Fixtures for LLM integration tests.

This conftest.py contains fixtures specific to LLM integration testing,
keeping them separate from the main test fixtures in the root conftest.py.
"""
import os
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId
from dotenv import load_dotenv
from mongomock_motor import AsyncMongoMockClient

from utils.encryption import encrypt_api_key

# Load environment variables from .env file
load_dotenv()


@pytest.fixture
def sample_user_id() -> str:
    """Return a sample user ID for integration tests."""
    return str(ObjectId())


@pytest.fixture
def integration_openai_key() -> str | None:
    """Get OpenAI API key from environment for integration tests."""
    return os.getenv("OPENAI_API_KEY")


@pytest.fixture
def integration_anthropic_key() -> str | None:
    """Get Anthropic API key from environment for integration tests."""
    return os.getenv("ANTHROPIC_API_KEY")


@pytest.fixture
def integration_google_key() -> str | None:
    """Get Google API key from environment for integration tests."""
    return os.getenv("GOOGLE_API_KEY")


@pytest.fixture
async def mock_integration_db_openai(sample_user_id: str, integration_openai_key: str):
    """Create a mock database with real OpenAI API key for integration tests."""
    if not integration_openai_key:
        pytest.skip("OPENAI_API_KEY not set")
    
    client = AsyncMongoMockClient()
    db = client["integration_test_db"]
    
    # Insert user with real encrypted API key
    await db.users.insert_one({
        "_id": ObjectId(sample_user_id),
        "email": "integration@example.com",
        "api_keys": {
            "openai_api_key": encrypt_api_key(integration_openai_key),
        }
    })
    
    return db


@pytest.fixture
async def mock_integration_db_anthropic(sample_user_id: str, integration_anthropic_key: str):
    """Create a mock database with real Anthropic API key for integration tests."""
    if not integration_anthropic_key:
        pytest.skip("ANTHROPIC_API_KEY not set")
    
    client = AsyncMongoMockClient()
    db = client["integration_test_db"]
    
    # Insert user with real encrypted API key
    await db.users.insert_one({
        "_id": ObjectId(sample_user_id),
        "email": "integration@example.com",
        "api_keys": {
            "anthropic_api_key": encrypt_api_key(integration_anthropic_key),
        }
    })
    
    return db


@pytest.fixture
async def mock_integration_db_google(sample_user_id: str, integration_google_key: str):
    """Create a mock database with real Google API key for integration tests."""
    if not integration_google_key:
        pytest.skip("GOOGLE_API_KEY not set")
    
    client = AsyncMongoMockClient()
    db = client["integration_test_db"]
    
    # Insert user with real encrypted API key
    await db.users.insert_one({
        "_id": ObjectId(sample_user_id),
        "email": "integration@example.com",
        "api_keys": {
            "google_api_key": encrypt_api_key(integration_google_key),
        }
    })
    
    return db

