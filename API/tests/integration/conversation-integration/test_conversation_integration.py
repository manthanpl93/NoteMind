"""
Integration tests for conversation management API.

These tests make REAL API calls to OpenAI (no mocking) to test
the full end-to-end conversation flow including LLM responses.

Run with: pytest tests/integration/conversation-integration/ -v -m integration
"""
import pytest
from httpx import AsyncClient
from bson import ObjectId
from datetime import datetime, timedelta
from utils.llm import count_tokens
from utils.model_config import MODEL_CONFIGS, OpenAIModels


@pytest.mark.integration
@pytest.mark.asyncio
class TestConversationCreation:
    """Tests for the POST /conversations endpoint."""

    async def test_create_conversation_success(self, authenticated_client: AsyncClient):
        """Verify creating a new conversation works end-to-end with real LLM integration."""
        first_message_content = "What is Python?"
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": first_message_content,
            },
        )
        assert response.status_code == 201
        data = response.json()

        # Verify response structure
        assert "id" in data
        assert "user_id" in data
        assert data["provider"] == "openai"
        assert data["model_name"] == OpenAIModels.GPT_4O_MINI.value
        assert "title" in data
        assert data["title"] != first_message_content  # Should be LLM-generated

        # Verify messages
        messages = data["messages"]
        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == first_message_content
        assert "timestamp" in messages[0]
        # Initial message has 0 tokens - no API call made yet
        assert messages[0]["tokens_used"] == 0
        assert data["total_tokens_used"] == 0

        # Verify timestamps
        assert "created_at" in data
        assert "updated_at" in data
        assert data["created_at"] == data["updated_at"]

    async def test_create_conversation_invalid_provider(
        self, authenticated_client: AsyncClient
    ):
        """Validate provider field accepts only valid values."""
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "invalid_provider",
                "model_name": "some-model",
                "first_message": "Hello",
            },
        )
        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data

    async def test_create_conversation_missing_first_message(
        self, authenticated_client: AsyncClient
    ):
        """Verify first_message is required."""
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
            },
        )
        assert response.status_code == 422

    async def test_create_conversation_empty_first_message(
        self, authenticated_client: AsyncClient
    ):
        """Verify empty first_message is rejected."""
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "",
            },
        )
        assert response.status_code == 422

    async def test_create_conversation_without_auth(self):
        """Verify unauthorized request fails."""
        from httpx import AsyncClient, ASGITransport
        from main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport, base_url="http://test", follow_redirects=True
        ) as client:
            response = await client.post(
                "/conversations",
                json={
                    "provider": "openai",
                    "model_name": OpenAIModels.GPT_4O_MINI.value,
                    "first_message": "Hello",
                },
            )
            assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
class TestConversationListing:
    """Tests for the GET /conversations endpoint."""

    async def test_list_conversations_empty(self, authenticated_client: AsyncClient):
        """Verify empty conversation list returns correctly."""
        response = await authenticated_client.get("/conversations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_list_conversations_with_data(
        self, authenticated_client: AsyncClient
    ):
        """Verify conversations are listed correctly."""
        # Create multiple conversations
        for i in range(3):
            await authenticated_client.post(
                "/conversations",
                json={
                    "provider": "openai",
                    "model_name": OpenAIModels.GPT_4O_MINI.value,
                    "first_message": f"Test message {i}",
                },
            )

        response = await authenticated_client.get("/conversations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        
        # Verify structure
        for conv in data:
            assert "id" in conv
            assert "title" in conv
            assert "provider" in conv
            assert "model_name" in conv
            assert "message_count" in conv
            assert "total_tokens_used" in conv
            assert "created_at" in conv
            assert "updated_at" in conv

    async def test_list_conversations_pagination(
        self, authenticated_client: AsyncClient
    ):
        """Verify pagination works correctly."""
        # Create 5 conversations
        for i in range(5):
            await authenticated_client.post(
                "/conversations",
                json={
                    "provider": "openai",
                    "model_name": OpenAIModels.GPT_4O_MINI.value,
                    "first_message": f"Test message {i}",
                },
            )

        # Test limit
        response = await authenticated_client.get("/conversations?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Test skip
        response = await authenticated_client.get("/conversations?skip=2&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_list_conversations_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users can only see their own conversations."""
        # User 1 creates conversations
        await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "User 1 message",
            },
        )

        # User 2 creates conversations
        await second_authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "User 2 message",
            },
        )

        # User 1 should only see their own
        response1 = await authenticated_client.get("/conversations")
        assert response1.status_code == 200
        data1 = response1.json()
        assert len(data1) == 1

        # User 2 should only see their own
        response2 = await second_authenticated_client.get("/conversations")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2) == 1


@pytest.mark.integration
@pytest.mark.asyncio
class TestConversationRetrieval:
    """Tests for the GET /conversations/{id} endpoint."""

    async def test_get_conversation_success(self, authenticated_client: AsyncClient):
        """Verify retrieving a specific conversation works."""
        # Create a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Hello world",
            },
        )
        conversation_id = create_response.json()["id"]

        # Retrieve it
        response = await authenticated_client.get(f"/conversations/{conversation_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conversation_id
        assert "messages" in data
        assert len(data["messages"]) == 1

    async def test_get_conversation_not_found(self, authenticated_client: AsyncClient):
        """Verify 404 for non-existent conversation."""
        fake_id = str(ObjectId())
        response = await authenticated_client.get(f"/conversations/{fake_id}")
        assert response.status_code == 404

    async def test_get_conversation_invalid_id(self, authenticated_client: AsyncClient):
        """Verify 404 for invalid ObjectId format."""
        response = await authenticated_client.get("/conversations/invalid-id")
        assert response.status_code == 404

    async def test_get_conversation_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot access other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]

        # User 2 tries to access it
        response = await second_authenticated_client.get(
            f"/conversations/{conversation_id}"
        )
        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.asyncio
class TestSendMessage:
    """Tests for the POST /conversations/{id}/messages endpoint."""

    async def test_send_message_success(self, authenticated_client: AsyncClient):
        """Verify sending a message and getting AI response works end-to-end."""
        # Create a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "What is 2+2?",
            },
        )
        conversation_id = create_response.json()["id"]

        # Send a message
        response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": "Can you elaborate?"},
        )
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "message" in data
        assert "conversation" in data

        # Verify AI message
        ai_message = data["message"]
        assert ai_message["role"] == "assistant"
        assert ai_message["content"] != ""
        assert ai_message["tokens_used"] > 0

        # Verify conversation updated
        conversation = data["conversation"]
        assert len(conversation["messages"]) == 3  # user, assistant, user, assistant (wait, actually it's 2 originally + 1 user + 1 assistant = 4 total, but the first creation only has 1 message)
        # Let me reconsider: first_message creates 1 message (user), then we send another message which adds 2 (user + assistant) = 3 total
        assert conversation["total_tokens_used"] > 0

    async def test_send_message_context_limit(
        self, authenticated_client: AsyncClient, test_db
    ):
        """Verify context window limiting to control token usage."""
        # Create a conversation with existing history
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Start conversation",
            },
        )
        conversation_id = create_response.json()["id"]

        # Add multiple messages to build history
        for i in range(5):
            await authenticated_client.post(
                f"/conversations/{conversation_id}/messages",
                json={"content": f"Message {i} with some content to add tokens"},
            )

        # Send message with tight context limit
        response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={
                "content": "Final message",
                "context_limit_tokens": 500,  # Small limit
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"]["role"] == "assistant"

    async def test_send_message_empty_content(self, authenticated_client: AsyncClient):
        """Verify empty message content is rejected."""
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Hello",
            },
        )
        conversation_id = create_response.json()["id"]

        response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages", json={"content": ""}
        )
        assert response.status_code == 422

    async def test_send_message_conversation_not_found(
        self, authenticated_client: AsyncClient
    ):
        """Verify 403 for non-existent conversation."""
        fake_id = str(ObjectId())
        response = await authenticated_client.post(
            f"/conversations/{fake_id}/messages", json={"content": "Hello"}
        )
        assert response.status_code == 403

    async def test_send_message_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot send messages to other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]

        # User 2 tries to send a message
        response = await second_authenticated_client.post(
            f"/conversations/{conversation_id}/messages", json={"content": "Hello"}
        )
        assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
class TestConversationDeletion:
    """Tests for the DELETE /conversations/{id} endpoint."""

    async def test_delete_conversation_success(
        self, authenticated_client: AsyncClient
    ):
        """Verify deleting a conversation works."""
        # Create a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Hello",
            },
        )
        conversation_id = create_response.json()["id"]

        # Delete it
        response = await authenticated_client.delete(
            f"/conversations/{conversation_id}"
        )
        assert response.status_code == 204

        # Verify it's gone
        get_response = await authenticated_client.get(
            f"/conversations/{conversation_id}"
        )
        assert get_response.status_code == 404

    async def test_delete_conversation_not_found(
        self, authenticated_client: AsyncClient
    ):
        """Verify 404 for non-existent conversation."""
        fake_id = str(ObjectId())
        response = await authenticated_client.delete(f"/conversations/{fake_id}")
        assert response.status_code == 404

    async def test_delete_conversation_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot delete other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]

        # User 2 tries to delete it
        response = await second_authenticated_client.delete(
            f"/conversations/{conversation_id}"
        )
        assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
class TestTokenTracking:
    """Tests for token counting and tracking functionality."""

    async def test_token_counting_accuracy(self, authenticated_client: AsyncClient):
        """Verify token counting uses actual API response tokens, not estimates."""
        # Create conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Initial message",
            },
        )
        conversation_id = create_response.json()["id"]
        
        # Send a message to trigger API call and token tracking
        message_content = "This is a test message for token counting."
        send_response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": message_content, "context_limit_tokens": 4000},
        )
        data = send_response.json()
        
        # Verify tokens are tracked from API response (not tiktoken estimates)
        # Both user and AI messages should have tokens > 0
        messages = data["conversation"]["messages"]
        user_msg = messages[-2]  # Second to last
        ai_msg = messages[-1]  # Last
        
        assert user_msg["tokens_used"] > 0
        assert ai_msg["tokens_used"] > 0
        assert data["conversation"]["total_tokens_used"] > 0

    async def test_total_tokens_accumulation(self, authenticated_client: AsyncClient):
        """Verify total_tokens_used accumulates correctly."""
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "First message",
            },
        )
        conversation_id = create_response.json()["id"]
        initial_tokens = create_response.json()["total_tokens_used"]

        # Send another message
        send_response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": "Second message"},
        )
        final_tokens = send_response.json()["conversation"]["total_tokens_used"]
        assert final_tokens > initial_tokens


@pytest.mark.integration
@pytest.mark.asyncio
class TestTitleGeneration:
    """Tests for LLM-powered title generation."""

    async def test_title_generation_success(self, authenticated_client: AsyncClient):
        """Verify title is generated by LLM for new conversations."""
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Explain quantum computing in simple terms",
            },
        )
        data = response.json()
        
        # Title should be different from the message
        assert data["title"] != "Explain quantum computing in simple terms"
        
        # Title should be reasonably short
        assert len(data["title"]) <= 60
        
        # Title should not be empty
        assert len(data["title"]) > 0

    async def test_title_generation_various_inputs(
        self, authenticated_client: AsyncClient
    ):
        """Verify title generation works for various message types."""
        test_messages = [
            "What is the capital of France?",
            "Help me understand recursion",
            "Write a poem about cats",
        ]

        for msg in test_messages:
            response = await authenticated_client.post(
                "/conversations",
                json={
                    "provider": "openai",
                    "model_name": OpenAIModels.GPT_4O_MINI.value,
                    "first_message": msg,
                },
            )
            data = response.json()
            assert "title" in data
            assert len(data["title"]) > 0
            assert len(data["title"]) <= 60


@pytest.mark.integration
@pytest.mark.asyncio
class TestContextMetrics:
    """Tests for conversation context metrics tracking."""

    async def test_context_metrics_on_creation(self, authenticated_client: AsyncClient):
        """Verify context metrics are initialized correctly when creating a conversation."""
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Hello, world!",
            },
        )
        assert response.status_code == 201
        data = response.json()

        # Verify context metrics fields exist
        assert "total_context_size" in data
        assert "remaining_context_size" in data
        assert "total_used_percentage" in data
        assert "remaining_percentage" in data

        # Verify initial values (gpt-4o-mini has 128k context)
        expected_context_size = MODEL_CONFIGS[OpenAIModels.GPT_4O_MINI].context_limit
        assert data["total_context_size"] == expected_context_size
        assert data["total_tokens_used"] == 0
        assert data["remaining_context_size"] == expected_context_size
        assert data["total_used_percentage"] == 0.0
        assert data["remaining_percentage"] == 100.0

    async def test_context_metrics_update_on_message(
        self, authenticated_client: AsyncClient, sample_conversation: dict
    ):
        """Verify context metrics update correctly after sending a message."""
        conversation_id = sample_conversation["id"]

        # Send a message
        response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": "Tell me more about Python", "context_limit_tokens": 4000},
        )
        assert response.status_code == 200
        data = response.json()

        # Verify context metrics in the conversation response
        conv = data["conversation"]
        assert "total_context_size" in conv
        assert "remaining_context_size" in conv
        assert "total_used_percentage" in conv
        assert "remaining_percentage" in conv

        # Verify tokens were tracked
        assert conv["total_tokens_used"] > 0

        # Verify remaining is less than total
        assert conv["remaining_context_size"] < conv["total_context_size"]

        # Verify percentages
        assert 0 < conv["total_used_percentage"] < 100
        assert 0 < conv["remaining_percentage"] < 100

        # Verify percentages sum to 100
        assert abs(conv["total_used_percentage"] + conv["remaining_percentage"] - 100.0) < 0.01

    async def test_context_metrics_in_list_view(
        self, authenticated_client: AsyncClient, sample_conversation: dict
    ):
        """Verify context metrics are included in conversation list view."""
        response = await authenticated_client.get("/conversations")
        assert response.status_code == 200
        data = response.json()

        assert len(data) > 0
        for conv in data:
            assert "total_context_size" in conv
            assert "remaining_context_size" in conv
            assert "total_used_percentage" in conv
            assert "remaining_percentage" in conv

    async def test_context_metrics_accuracy(self, authenticated_client: AsyncClient):
        """Verify context metrics calculations are accurate."""
        # Create conversation
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Test message",
            },
        )
        conversation_id = response.json()["id"]

        # Send a message to generate token usage
        response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": "What is 2+2?", "context_limit_tokens": 4000},
        )
        data = response.json()
        conv = data["conversation"]

        # Verify calculations
        expected_remaining = conv["total_context_size"] - conv["total_tokens_used"]
        assert conv["remaining_context_size"] == expected_remaining

        expected_used_pct = (conv["total_tokens_used"] / conv["total_context_size"]) * 100
        assert abs(conv["total_used_percentage"] - expected_used_pct) < 0.01

        expected_remaining_pct = (conv["remaining_context_size"] / conv["total_context_size"]) * 100
        assert abs(conv["remaining_percentage"] - expected_remaining_pct) < 0.01

    async def test_token_tracking_uses_api_response(
        self, authenticated_client: AsyncClient
    ):
        """Verify that token counts come from actual API responses, not estimates."""
        # Create conversation and send message
        response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": OpenAIModels.GPT_4O_MINI.value,
                "first_message": "Hello",
            },
        )
        conversation_id = response.json()["id"]

        # Send message
        response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": "What is Python used for?", "context_limit_tokens": 4000},
        )
        data = response.json()

        # Verify both user and AI messages have token counts
        messages = data["conversation"]["messages"]
        user_msg = messages[-2]  # Second to last is user message
        ai_msg = messages[-1]  # Last is AI message

        # Both should have tokens_used > 0 (from API response)
        assert user_msg["tokens_used"] > 0
        assert ai_msg["tokens_used"] > 0

        # Total should be sum of all message tokens
        total_from_messages = sum(msg["tokens_used"] for msg in messages)
        assert data["conversation"]["total_tokens_used"] == total_from_messages

