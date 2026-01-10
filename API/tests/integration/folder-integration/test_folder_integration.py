"""Integration tests for folder functionality."""
import pytest
from bson import ObjectId
from httpx import AsyncClient


class TestFolderCRUD:
    """Test folder CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_folder_success(self, authenticated_client: AsyncClient):
        """Test creating a folder with valid data."""
        response = await authenticated_client.post(
            "/folders",
            json={"name": "Work Projects"}
        )

        assert response.status_code == 201
        data = response.json()

        assert "id" in data
        assert data["name"] == "Work Projects"
        assert "user_id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["created_at"] == data["updated_at"]  # Should be same on creation

    @pytest.mark.asyncio
    async def test_create_folder_duplicate_name_fails(self, authenticated_client: AsyncClient):
        """Test that creating a folder with duplicate name fails."""
        # Create first folder
        response1 = await authenticated_client.post(
            "/folders/",
            json={"name": "Work Projects"}
        )
        assert response1.status_code == 201

        # Try to create second folder with same name
        response2 = await authenticated_client.post(
            "/folders/",
            json={"name": "Work Projects"}
        )
        assert response2.status_code == 409
        data = response2.json()
        assert "already exists" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_folder_duplicate_name_case_insensitive(self, authenticated_client: AsyncClient):
        """Test that folder names are case-insensitive unique."""
        # Create first folder
        response1 = await authenticated_client.post(
            "/folders/",
            json={"name": "Work Projects"}
        )
        assert response1.status_code == 201

        # Try to create with different case
        response2 = await authenticated_client.post(
            "/folders/",
            json={"name": "work projects"}
        )
        assert response2.status_code == 409

    @pytest.mark.asyncio
    async def test_list_folders_empty(self, authenticated_client: AsyncClient):
        """Test listing folders when none exist."""
        response = await authenticated_client.get("/folders")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_list_folders_with_data(self, authenticated_client: AsyncClient, folder_factory):
        """Test listing folders with data."""
        import asyncio

        # Create some folders with slight delays to ensure ordering
        await folder_factory("Folder A")
        await asyncio.sleep(0.01)  # Small delay
        await folder_factory("Folder B")
        await asyncio.sleep(0.01)  # Small delay
        await folder_factory("Folder C")

        response = await authenticated_client.get("/folders")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        # Check that all folders are present (order may vary due to timing)
        folder_names = [f["name"] for f in data]
        assert "Folder A" in folder_names
        assert "Folder B" in folder_names
        assert "Folder C" in folder_names

        # Check response structure
        folder = data[0]
        assert "id" in folder
        assert "name" in folder
        assert "created_at" in folder
        assert "updated_at" in folder
        # user_id should not be in list response
        assert "user_id" not in folder

    @pytest.mark.asyncio
    async def test_list_folders_pagination(self, authenticated_client: AsyncClient, folder_factory):
        """Test folder listing pagination."""
        # Create multiple folders
        for i in range(5):
            await folder_factory(f"Folder {i}")

        # Test limit
        response = await authenticated_client.get("/folders?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Test skip
        response = await authenticated_client.get("/folders?skip=2&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_get_folder_success(self, authenticated_client: AsyncClient, folder_factory):
        """Test getting a specific folder."""
        folder = await folder_factory("Test Folder")

        response = await authenticated_client.get(f"/folders/{folder['_id']}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == str(folder["_id"])
        assert data["name"] == "Test Folder"
        assert "user_id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.asyncio
    async def test_get_folder_not_found(self, authenticated_client: AsyncClient):
        """Test getting a non-existent folder."""
        fake_id = str(ObjectId())
        response = await authenticated_client.get(f"/folders/{fake_id}")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_get_folder_invalid_id(self, authenticated_client: AsyncClient):
        """Test getting a folder with invalid ObjectId."""
        response = await authenticated_client.get("/folders/invalid-id")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_folder_success(self, authenticated_client: AsyncClient, folder_factory):
        """Test updating a folder name."""
        folder = await folder_factory("Old Name")

        response = await authenticated_client.patch(
            f"/folders/{folder['_id']}",
            json={"name": "New Name"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == str(folder["_id"])
        assert data["name"] == "New Name"
        assert data["updated_at"] != data["created_at"]  # Should be updated

    @pytest.mark.asyncio
    async def test_update_folder_duplicate_name_fails(self, authenticated_client: AsyncClient, folder_factory):
        """Test that updating to duplicate name fails."""
        await folder_factory("Existing Folder")
        folder_to_update = await folder_factory("Folder to Update")

        response = await authenticated_client.patch(
            f"/folders/{folder_to_update['_id']}",
            json={"name": "Existing Folder"}
        )

        assert response.status_code == 409
        data = response.json()
        assert "already exists" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_folder_case_insensitive_duplicate(self, authenticated_client: AsyncClient, folder_factory):
        """Test case-insensitive duplicate check on update."""
        await folder_factory("Existing Folder")
        folder_to_update = await folder_factory("Folder to Update")

        response = await authenticated_client.patch(
            f"/folders/{folder_to_update['_id']}",
            json={"name": "existing folder"}  # Different case
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_delete_folder_success(self, authenticated_client: AsyncClient, folder_factory):
        """Test deleting an empty folder."""
        folder = await folder_factory("Folder to Delete")

        response = await authenticated_client.delete(f"/folders/{folder['_id']}")

        assert response.status_code == 204

        # Verify folder is gone
        response = await authenticated_client.get(f"/folders/{folder['_id']}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_folder_with_conversations_fails(self, authenticated_client: AsyncClient, folder_factory, conversation_factory):
        """Test that deleting folder with conversations fails."""
        folder = await folder_factory("Folder with Conversations")
        await conversation_factory("Test message", folder["_id"])

        response = await authenticated_client.delete(f"/folders/{folder['_id']}")

        assert response.status_code == 409
        data = response.json()
        assert "conversation" in data["detail"].lower()

        # Verify folder still exists
        response = await authenticated_client.get(f"/folders/{folder['_id']}")
        assert response.status_code == 200


class TestFolderOwnership:
    """Test folder ownership and access control."""

    @pytest.mark.asyncio
    async def test_user_can_only_access_own_folders(self, authenticated_client: AsyncClient, authenticated_client2: AsyncClient, folder_factory, test_user2):
        """Test that users can only access their own folders."""
        # Create folder for user 1
        folder = await folder_factory("User 1 Folder")

        # User 2 tries to access user 1's folder
        response = await authenticated_client2.get(f"/folders/{folder['_id']}/")
        assert response.status_code == 403

        # User 2 tries to update user 1's folder
        response = await authenticated_client2.patch(
            f"/folders/{folder['_id']}",
            json={"name": "Hacked Name"}
        )
        assert response.status_code == 403

        # User 2 tries to delete user 1's folder
        response = await authenticated_client2.delete(f"/folders/{folder['_id']}")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_folders_isolation(self, authenticated_client: AsyncClient, authenticated_client2: AsyncClient, folder_factory, test_user2):
        """Test that users only see their own folders in list."""
        # Create folders for both users
        await folder_factory("User 1 Folder A")
        await folder_factory("User 1 Folder B")

        # Create folder for user 2 using different factory
        from database import get_database
        db = get_database()
        from datetime import datetime

        user2_folder = {
            "user_id": test_user2["_id"],
            "name": "User 2 Folder",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.folders.insert_one(user2_folder)

        # User 1 should only see their folders
        response = await authenticated_client.get("/folders")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        folder_names = [f["name"] for f in data]
        assert "User 1 Folder A" in folder_names
        assert "User 1 Folder B" in folder_names
        assert "User 2 Folder" not in folder_names

        # User 2 should only see their folder
        response = await authenticated_client2.get("/folders")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "User 2 Folder"


class TestFolderConversationIntegration:
    """Test integration between folders and conversations."""

    @pytest.mark.asyncio
    async def test_create_conversation_with_valid_folder(self, authenticated_client: AsyncClient, folder_factory):
        """Test creating conversation with valid folder_id."""
        folder = await folder_factory("Test Folder")

        response = await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message",
                "folder_id": str(folder["_id"])
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["folder_id"] == str(folder["_id"])

    @pytest.mark.asyncio
    async def test_create_conversation_without_folder(self, authenticated_client: AsyncClient):
        """Test creating conversation without folder_id."""
        response = await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["folder_id"] is None

    @pytest.mark.asyncio
    async def test_create_conversation_with_invalid_folder_id(self, authenticated_client: AsyncClient):
        """Test creating conversation with invalid folder_id."""
        fake_id = str(ObjectId())

        response = await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message",
                "folder_id": fake_id
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_conversation_with_other_user_folder(self, authenticated_client2: AsyncClient, folder_factory):
        """Test creating conversation with another user's folder_id."""
        folder = await folder_factory("Other User's Folder")

        response = await authenticated_client2.post(
            "/conversations",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message",
                "folder_id": str(folder["_id"])
            }
        )

        assert response.status_code == 403
        data = response.json()
        assert "permission" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_conversation_with_invalid_objectid(self, authenticated_client: AsyncClient):
        """Test creating conversation with invalid ObjectId format."""
        response = await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message",
                "folder_id": "invalid-id"
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "format" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_list_conversations_includes_folder_id(self, authenticated_client: AsyncClient, folder_factory):
        """Test that conversation listing includes folder_id."""
        folder = await folder_factory("Test Folder")

        # Create conversation with folder
        await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Message with folder",
                "folder_id": str(folder["_id"])
            }
        )

        # Create conversation without folder
        await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Message without folder"
            }
        )

        response = await authenticated_client.get("/conversations")
        assert response.status_code == 200
        data = response.json()

        assert len(data) == 2

        # Find conversations and check folder_id
        with_folder = next(c for c in data if c["folder_id"] == str(folder["_id"]))
        without_folder = next(c for c in data if c["folder_id"] is None)

        assert with_folder["folder_id"] == str(folder["_id"])
        assert without_folder["folder_id"] is None

    @pytest.mark.asyncio
    async def test_filter_conversations_by_folder_id(self, authenticated_client: AsyncClient, folder_factory):
        """Test filtering conversations by folder_id."""
        folder1 = await folder_factory("Folder 1")
        folder2 = await folder_factory("Folder 2")

        # Create conversations in different folders
        await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "In folder 1",
                "folder_id": str(folder1["_id"])
            }
        )

        await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "In folder 2",
                "folder_id": str(folder2["_id"])
            }
        )

        await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "No folder"
            }
        )

        # Filter by folder 1
        response = await authenticated_client.get(f"/conversations?folder_id={folder1['_id']}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["folder_id"] == str(folder1["_id"])

        # Filter by folder 2
        response = await authenticated_client.get(f"/conversations?folder_id={folder2['_id']}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["folder_id"] == str(folder2["_id"])

        # Filter for conversations without folders
        response = await authenticated_client.get("/conversations?folder_id=null")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["folder_id"] is None

    @pytest.mark.asyncio
    async def test_conversation_folder_id_immutable(self, authenticated_client: AsyncClient, folder_factory):
        """Test that folder_id cannot be changed after creation."""
        folder1 = await folder_factory("Folder 1")
        folder2 = await folder_factory("Folder 2")

        # Create conversation in folder 1
        create_response = await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message",
                "folder_id": str(folder1["_id"])
            }
        )
        conversation_id = create_response.json()["id"]

        # Try to send message (which shouldn't change folder_id)
        send_response = await authenticated_client.post(
            f"/conversations/{conversation_id}/messages",
            json={"content": "Another message"}
        )
        assert send_response.status_code == 200

        # Check that folder_id is still the same
        get_response = await authenticated_client.get(f"/conversations/{conversation_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["folder_id"] == str(folder1["_id"])

        # Try to switch model (which also shouldn't change folder_id)
        switch_response = await authenticated_client.patch(
            f"/conversations/{conversation_id}/model",
            json={"model": "gpt-4-turbo"}
        )
        assert switch_response.status_code == 200

        # Check that folder_id is still the same
        get_response = await authenticated_client.get(f"/conversations/{conversation_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["folder_id"] == str(folder1["_id"])

    @pytest.mark.asyncio
    async def test_delete_conversation_folder_remains(self, authenticated_client: AsyncClient, folder_factory):
        """Test that deleting conversation doesn't delete folder."""
        folder = await folder_factory("Test Folder")

        # Create conversation in folder
        create_response = await authenticated_client.post(
            "/conversations/",
            json={
                "provider": "openai",
                "model_name": "gpt-4o-mini",
                "first_message": "Test message",
                "folder_id": str(folder["_id"])
            }
        )
        conversation_id = create_response.json()["id"]

        # Delete conversation
        delete_response = await authenticated_client.delete(f"/conversations/{conversation_id}")
        assert delete_response.status_code == 204

        # Check that folder still exists
        folder_response = await authenticated_client.get(f"/folders/{folder['_id']}/")
        assert folder_response.status_code == 200

    @pytest.mark.asyncio
    async def test_multiple_conversations_same_folder(self, authenticated_client: AsyncClient, folder_factory):
        """Test creating multiple conversations in the same folder."""
        folder = await folder_factory("Shared Folder")

        # Create multiple conversations in same folder
        for i in range(3):
            response = await authenticated_client.post(
                "/conversations",
                json={
                    "provider": "openai",
                    "model_name": "gpt-4o-mini",
                    "first_message": f"Message {i}",
                    "folder_id": str(folder["_id"])
                }
            )
            assert response.status_code == 201
            data = response.json()
            assert data["folder_id"] == str(folder["_id"])

        # Check that folder list shows all conversations
        response = await authenticated_client.get(f"/conversations?folder_id={folder['_id']}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        # Verify folder cannot be deleted
        delete_response = await authenticated_client.delete(f"/folders/{folder['_id']}")
        assert delete_response.status_code == 409
