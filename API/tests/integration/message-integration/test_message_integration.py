"""
Integration tests for message management API.

These tests verify message-specific endpoints including pagination, editing, and deletion.

Run with: pytest tests/integration/message-integration/ -v -m integration
"""
import pytest
from httpx import AsyncClient
from bson import ObjectId


@pytest.mark.integration
@pytest.mark.asyncio
class TestGetMessages:
    """Tests for GET /messages/conversations/{conversation_id}/messages endpoint."""

    async def test_get_messages_success(
        self, authenticated_client: AsyncClient, sample_conversation: dict
    ):
        """Verify getting paginated messages works correctly."""
        conversation_id = str(sample_conversation["_id"])
        
        response = await authenticated_client.get(
            f"/conversations/{conversation_id}/messages"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data
        assert data["total"] == 2
        assert "skip" in data
        assert "limit" in data
        assert "messages" in data
        assert len(data["messages"]) == 2
        
        # Verify message structure
        for msg in data["messages"]:
            assert "id" in msg
            assert "conversation_id" in msg
            assert msg["conversation_id"] == conversation_id
            assert "role" in msg
            assert "content" in msg
            assert "timestamp" in msg
            assert "tokens_used" in msg
            assert "sequence_number" in msg

    async def test_get_messages_pagination(
        self, authenticated_client: AsyncClient, sample_conversation: dict
    ):
        """Verify pagination works correctly."""
        conversation_id = str(sample_conversation["_id"])
        
        # Test limit
        response = await authenticated_client.get(
            f"/conversations/{conversation_id}/messages?limit=1"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 1
        assert data["total"] == 2
        
        # Test skip
        response = await authenticated_client.get(
            f"/conversations/{conversation_id}/messages?skip=1&limit=1"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 1
        assert data["skip"] == 1

    async def test_get_messages_order_desc(
        self, authenticated_client: AsyncClient, sample_conversation: dict
    ):
        """Verify descending order returns newest messages first."""
        conversation_id = str(sample_conversation["_id"])
        
        response = await authenticated_client.get(
            f"/conversations/{conversation_id}/messages?order=desc"
        )
        
        assert response.status_code == 200
        data = response.json()
        messages = data["messages"]
        
        # Should be ordered newest first (sequence_number descending)
        assert messages[0]["sequence_number"] > messages[1]["sequence_number"]

    async def test_get_messages_not_found(
        self, authenticated_client: AsyncClient
    ):
        """Verify 404 for non-existent conversation."""
        fake_id = str(ObjectId())
        response = await authenticated_client.get(
            f"/conversations/{fake_id}/messages"
        )
        assert response.status_code == 404

    async def test_get_messages_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot access messages from other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]
        
        # User 2 tries to access messages
        response = await second_authenticated_client.get(
            f"/conversations/{conversation_id}/messages"
        )
        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.asyncio
class TestGetSingleMessage:
    """Tests for GET /messages/{message_id} endpoint."""

    async def test_get_message_success(
        self, authenticated_client: AsyncClient, sample_conversation: dict, test_db
    ):
        """Verify getting a single message works correctly."""
        # Get a message ID from the conversation
        conversation_id = sample_conversation["_id"]
        message = await test_db.messages.find_one({"conversation_id": conversation_id})
        message_id = str(message["_id"])
        
        response = await authenticated_client.get(f"/messages/{message_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == message_id
        assert "conversation_id" in data
        assert "role" in data
        assert "content" in data
        assert "timestamp" in data
        assert "tokens_used" in data
        assert "sequence_number" in data

    async def test_get_message_not_found(self, authenticated_client: AsyncClient):
        """Verify 404 for non-existent message."""
        fake_id = str(ObjectId())
        response = await authenticated_client.get(f"/messages/{fake_id}")
        assert response.status_code == 404

    async def test_get_message_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot access messages from other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]
        
        # Get messages to find message ID
        messages_response = await authenticated_client.get(f"/conversations/{conversation_id}/messages")
        message_id = messages_response.json()["messages"][0]["id"]
        
        # User 2 tries to access the message
        response = await second_authenticated_client.get(f"/messages/{message_id}")
        assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
class TestUpdateMessage:
    """Tests for PATCH /messages/{message_id} endpoint."""

    async def test_update_message_success(
        self, authenticated_client: AsyncClient, sample_conversation: dict, test_db
    ):
        """Verify updating a user message works correctly."""
        conversation_id = sample_conversation["_id"]
        message = await test_db.messages.find_one({
            "conversation_id": conversation_id,
            "role": "user"
        })
        message_id = str(message["_id"])
        
        new_content = "Updated message content"
        response = await authenticated_client.patch(
            f"/messages/{message_id}",
            json={"content": new_content}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == new_content
        assert data["id"] == message_id

    async def test_update_assistant_message_fails(
        self, authenticated_client: AsyncClient, sample_conversation: dict, test_db
    ):
        """Verify updating an assistant message is not allowed."""
        conversation_id = sample_conversation["_id"]
        message = await test_db.messages.find_one({
            "conversation_id": conversation_id,
            "role": "assistant"
        })
        message_id = str(message["_id"])
        
        response = await authenticated_client.patch(
            f"/messages/{message_id}",
            json={"content": "Try to update assistant message"}
        )
        
        assert response.status_code == 400
        error_data = response.json()
        assert "Only user messages can be edited" in error_data["detail"]

    async def test_update_message_not_found(self, authenticated_client: AsyncClient):
        """Verify 404 for non-existent message."""
        fake_id = str(ObjectId())
        response = await authenticated_client.patch(
            f"/messages/{fake_id}",
            json={"content": "New content"}
        )
        assert response.status_code == 404

    async def test_update_message_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot update messages from other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]
        
        # Get messages to find message ID
        messages_response = await authenticated_client.get(f"/conversations/{conversation_id}/messages")
        message_id = messages_response.json()["messages"][0]["id"]
        
        # User 2 tries to update the message
        response = await second_authenticated_client.patch(
            f"/messages/{message_id}",
            json={"content": "Hacked content"}
        )
        assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
class TestDeleteMessage:
    """Tests for DELETE /messages/{message_id} endpoint."""

    async def test_delete_message_success(
        self, authenticated_client: AsyncClient, sample_conversation: dict, test_db
    ):
        """Verify deleting a message works correctly."""
        conversation_id = sample_conversation["_id"]
        message = await test_db.messages.find_one({"conversation_id": conversation_id})
        message_id = str(message["_id"])
        initial_count = sample_conversation["message_count"]
        
        response = await authenticated_client.delete(f"/messages/{message_id}")
        
        assert response.status_code == 204
        
        # Verify message is deleted
        deleted_message = await test_db.messages.find_one({"_id": ObjectId(message_id)})
        assert deleted_message is None
        
        # Verify conversation message_count is decremented
        updated_conv = await test_db.conversations.find_one({"_id": conversation_id})
        assert updated_conv["message_count"] == initial_count - 1

    async def test_delete_message_not_found(self, authenticated_client: AsyncClient):
        """Verify 404 for non-existent message."""
        fake_id = str(ObjectId())
        response = await authenticated_client.delete(f"/messages/{fake_id}")
        assert response.status_code == 404

    async def test_delete_message_user_isolation(
        self, authenticated_client: AsyncClient, second_authenticated_client: AsyncClient
    ):
        """Verify users cannot delete messages from other users' conversations."""
        # User 1 creates a conversation
        create_response = await authenticated_client.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "User 1 message",
            },
        )
        conversation_id = create_response.json()["id"]
        
        # Get messages to find message ID
        messages_response = await authenticated_client.get(f"/conversations/{conversation_id}/messages")
        message_id = messages_response.json()["messages"][0]["id"]
        
        # User 2 tries to delete the message
        response = await second_authenticated_client.delete(f"/messages/{message_id}")
        assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
class TestMessageSequenceIntegrity:
    """Tests to verify sequence_number integrity."""

    async def test_sequence_numbers_are_ordered(
        self, authenticated_client: AsyncClient, sample_conversation: dict
    ):
        """Verify sequence numbers are properly ordered."""
        conversation_id = str(sample_conversation["_id"])
        
        response = await authenticated_client.get(
            f"/conversations/{conversation_id}/messages"
        )
        
        assert response.status_code == 200
        messages = response.json()["messages"]
        
        # Verify sequence numbers are sequential
        for i, msg in enumerate(messages):
            assert msg["sequence_number"] == i

