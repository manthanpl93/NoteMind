"""Shared test fixtures for pytest."""
import os
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId
from dotenv import load_dotenv
from langchain_core.messages import AIMessage
from mongomock_motor import AsyncMongoMockClient

from utils.encryption import encrypt_api_key

# Load environment variables from .env file
load_dotenv()


@pytest.fixture
def sample_user_id() -> str:
    """Return a sample user ID."""
    return str(ObjectId())


@pytest.fixture
def sample_api_keys() -> dict[str, str]:
    """Return sample API keys for testing."""
    return {
        "openai": "sk-test-openai-key-12345",
        "anthropic": "sk-ant-test-anthropic-key-67890",
        "google": "test-google-key-abcde",
    }


@pytest.fixture
def encrypted_api_keys(sample_api_keys: dict[str, str]) -> dict[str, str]:
    """Return encrypted API keys for testing."""
    # Note: This requires a valid encryption key in environment
    # For testing, we'll mock the encryption or use test keys
    return {
        "openai_api_key": encrypt_api_key(sample_api_keys["openai"]),
        "anthropic_api_key": encrypt_api_key(sample_api_keys["anthropic"]),
        "google_api_key": encrypt_api_key(sample_api_keys["google"]),
    }


@pytest.fixture
def mock_user_with_keys(sample_user_id: str, encrypted_api_keys: dict[str, str]) -> dict[str, Any]:
    """Return a mock user document with API keys."""
    return {
        "_id": ObjectId(sample_user_id),
        "email": "test@example.com",
        "name": "Test User",
        "api_keys": encrypted_api_keys,
    }


@pytest.fixture
def mock_user_without_keys(sample_user_id: str) -> dict[str, Any]:
    """Return a mock user document without API keys."""
    return {
        "_id": ObjectId(sample_user_id),
        "email": "test@example.com",
        "name": "Test User",
        "api_keys": {},
    }


@pytest.fixture
async def mock_database(sample_user_id: str, encrypted_api_keys: dict[str, str]):
    """Create a mock database instance with mongomock-motor."""
    client = AsyncMongoMockClient()
    db = client["test_db"]
    
    # Insert a test user with API keys
    await db.users.insert_one({
        "_id": ObjectId(sample_user_id),
        "email": "test@example.com",
        "name": "Test User",
        "api_keys": encrypted_api_keys,
    })
    
    return db


@pytest.fixture
async def mock_database_no_user():
    """Create a mock database instance with no users."""
    client = AsyncMongoMockClient()
    db = client["test_db"]
    # Don't insert any users - collection is empty
    return db


@pytest.fixture
async def mock_database_no_keys(sample_user_id: str):
    """Create a mock database instance with user but no API keys."""
    client = AsyncMongoMockClient()
    db = client["test_db"]
    
    # Insert a user without API keys
    await db.users.insert_one({
        "_id": ObjectId(sample_user_id),
        "email": "test@example.com",
        "name": "Test User",
        "api_keys": {},
    })
    
    return db


@pytest.fixture
def sample_messages() -> list[dict[str, str]]:
    """Return sample message array for testing."""
    return [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you?"},
        {"role": "assistant", "content": "I'm doing well, thank you!"},
        {"role": "user", "content": "What's the weather like?"},
    ]


@pytest.fixture
def sample_simple_messages() -> list[dict[str, str]]:
    """Return a simple message array for testing."""
    return [
        {"role": "user", "content": "Say hello"},
    ]


@pytest.fixture
def mock_openai_model() -> MagicMock:
    """Create a mock OpenAI chat model."""
    mock_model = MagicMock()
    mock_response = AIMessage(content="Test response from OpenAI")
    mock_model.ainvoke = AsyncMock(return_value=mock_response)
    return mock_model


@pytest.fixture
def mock_anthropic_model() -> MagicMock:
    """Create a mock Anthropic chat model."""
    mock_model = MagicMock()
    mock_response = AIMessage(content="Test response from Anthropic")
    mock_model.ainvoke = AsyncMock(return_value=mock_response)
    return mock_model


@pytest.fixture
def mock_google_model() -> MagicMock:
    """Create a mock Google chat model."""
    mock_model = MagicMock()
    mock_response = AIMessage(content="Test response from Google")
    mock_model.ainvoke = AsyncMock(return_value=mock_response)
    return mock_model

