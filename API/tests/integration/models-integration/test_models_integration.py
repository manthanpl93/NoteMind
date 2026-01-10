"""Integration tests for the /models endpoint."""
import pytest
import pytest_asyncio
from utils.model_config import MODEL_CONFIGS


class TestModelsEndpoint:
    """Test the GET /models endpoint."""

    @pytest.mark.asyncio
    async def test_successful_retrieval_with_authentication(self, authenticated_client):
        """Test that authenticated users can successfully retrieve models."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        assert "models" in data
        assert isinstance(data["models"], list)

    @pytest.mark.asyncio
    async def test_unauthenticated_access_returns_403(self, unauthenticated_client):
        """Test that unauthenticated requests are rejected with 403."""
        response = await unauthenticated_client.get("/models")

        assert response.status_code == 403

        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_response_contains_expected_models_count(self, authenticated_client):
        """Test that response contains all expected models (10 total)."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        models = data["models"]

        # Should have 10 models total based on MODEL_CONFIGS
        assert len(models) == len(MODEL_CONFIGS)

    @pytest.mark.asyncio
    async def test_each_model_has_correct_structure(self, authenticated_client):
        """Test that each model in response has the correct structure."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        models = data["models"]

        for model in models:
            assert "id" in model
            assert "name" in model
            assert "provider" in model

            assert isinstance(model["id"], str)
            assert isinstance(model["name"], str)
            assert isinstance(model["provider"], str)

            assert len(model["id"]) > 0
            assert len(model["name"]) > 0
            assert len(model["provider"]) > 0

    @pytest.mark.asyncio
    async def test_all_providers_are_represented(self, authenticated_client):
        """Test that models from all providers (OpenAI, Anthropic, Google) are present."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        models = data["models"]

        # Extract unique providers from response
        providers = set(model["provider"] for model in models)

        # Should have all three providers
        expected_providers = {"openai", "anthropic", "google"}
        assert providers == expected_providers

    @pytest.mark.asyncio
    async def test_model_ids_match_config_keys(self, authenticated_client):
        """Test that model IDs in response match the MODEL_CONFIGS keys."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        models = data["models"]

        # Extract IDs from response
        response_ids = set(model["id"] for model in models)

        # Extract IDs from MODEL_CONFIGS
        config_ids = set(str(key) for key in MODEL_CONFIGS.keys())

        assert response_ids == config_ids

    @pytest.mark.asyncio
    async def test_model_names_match_config_names(self, authenticated_client):
        """Test that model names in response match the MODEL_CONFIGS names."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        models = data["models"]

        # Create mapping of id -> name from response
        response_names = {model["id"]: model["name"] for model in models}

        # Check that names match MODEL_CONFIGS
        for config_key, config_info in MODEL_CONFIGS.items():
            config_id = str(config_key)
            assert config_id in response_names
            assert response_names[config_id] == config_info.name

    @pytest.mark.asyncio
    async def test_model_providers_match_config_providers(self, authenticated_client):
        """Test that model providers in response match the MODEL_CONFIGS providers."""
        response = await authenticated_client.get("/models")

        assert response.status_code == 200

        data = response.json()
        models = data["models"]

        # Create mapping of id -> provider from response
        response_providers = {model["id"]: model["provider"] for model in models}

        # Check that providers match MODEL_CONFIGS
        for config_key, config_info in MODEL_CONFIGS.items():
            config_id = str(config_key)
            assert config_id in response_providers
            assert response_providers[config_id] == config_info.provider
