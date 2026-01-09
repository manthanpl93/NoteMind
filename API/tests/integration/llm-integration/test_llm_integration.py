"""Integration tests for LLM utilities with real API calls.

These tests require real API keys set in environment variables:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY  
- GOOGLE_API_KEY

Tests will be skipped if the corresponding API key is not set.
"""
import os
import pytest

from utils.llm import (
    Provider,
    get_user_api_key,
    get_chat_model,
    chat_with_model,
)


@pytest.mark.integration
@pytest.mark.slow
class TestOpenAIIntegration:
    """Integration tests for OpenAI provider."""
    
    @pytest.mark.asyncio
    async def test_openai_get_user_api_key(
        self, sample_user_id, mock_integration_db_openai, integration_openai_key
    ):
        """Test retrieving OpenAI API key from mock database."""
        if not integration_openai_key:
            pytest.skip("OPENAI_API_KEY not set")
        
        result = await get_user_api_key(
            sample_user_id, Provider.OPENAI, mock_integration_db_openai
        )
        
        assert result == integration_openai_key
    
    @pytest.mark.asyncio
    async def test_openai_get_chat_model(
        self, sample_user_id, mock_integration_db_openai, integration_openai_key
    ):
        """Test creating real OpenAI chat model."""
        if not integration_openai_key:
            pytest.skip("OPENAI_API_KEY not set")
        
        model = await get_chat_model(
            sample_user_id, Provider.OPENAI, mock_integration_db_openai
        )
        
        assert model is not None
        assert hasattr(model, "ainvoke")
    
    @pytest.mark.asyncio
    async def test_openai_chat_simple(
        self, sample_user_id, mock_integration_db_openai, integration_openai_key
    ):
        """Test real chat completion with OpenAI."""
        if not integration_openai_key:
            pytest.skip("OPENAI_API_KEY not set")
        
        messages = [
            {"role": "user", "content": "Say 'Hello, World!' and nothing else."}
        ]
        
        response_content, input_tokens, output_tokens = await chat_with_model(
            sample_user_id, Provider.OPENAI, messages, mock_integration_db_openai
        )
        
        assert response_content is not None
        assert isinstance(response_content, str)
        assert len(response_content) > 0
        assert input_tokens > 0
        assert output_tokens > 0
        print(f"\nOpenAI response: {response_content}")
        print(f"Tokens - Input: {input_tokens}, Output: {output_tokens}")
    
    @pytest.mark.asyncio
    async def test_openai_chat_conversation(
        self, sample_user_id, mock_integration_db_openai, integration_openai_key
    ):
        """Test real chat with conversation history."""
        if not integration_openai_key:
            pytest.skip("OPENAI_API_KEY not set")
        
        messages = [
            {"role": "system", "content": "You are a helpful assistant that answers briefly."},
            {"role": "user", "content": "What is 2+2?"},
            {"role": "assistant", "content": "2+2 equals 4."},
            {"role": "user", "content": "What about 3+3?"},
        ]
        
        response_content, input_tokens, output_tokens = await chat_with_model(
            sample_user_id, Provider.OPENAI, messages, mock_integration_db_openai
        )
        
        assert response_content is not None
        assert isinstance(response_content, str)
        assert len(response_content) > 0
        assert input_tokens > 0
        assert output_tokens > 0
        # The response should be about 6 or addition
        assert any(keyword in response_content.lower() for keyword in ["6", "six", "equals"])
        print(f"\nOpenAI conversation response: {response_content}")
        print(f"Tokens - Input: {input_tokens}, Output: {output_tokens}")
    
    @pytest.mark.asyncio
    async def test_openai_custom_model(
        self, sample_user_id, mock_integration_db_openai, integration_openai_key
    ):
        """Test using a custom OpenAI model."""
        if not integration_openai_key:
            pytest.skip("OPENAI_API_KEY not set")
        
        messages = [
            {"role": "user", "content": "Say 'test' and nothing else."}
        ]
        
        # Use gpt-4o-mini which is typically faster and cheaper for testing
        response_content, input_tokens, output_tokens = await chat_with_model(
            sample_user_id,
            Provider.OPENAI,
            messages,
            mock_integration_db_openai,
            model_name="gpt-4o-mini",
        )
        
        assert response_content is not None
        assert isinstance(response_content, str)
        assert input_tokens > 0
        assert output_tokens > 0
        print(f"\nOpenAI custom model response: {response_content}")
        print(f"Tokens - Input: {input_tokens}, Output: {output_tokens}")


