"""Unit tests for LLM utilities with mocked dependencies."""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import HTTPException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

from utils.llm import (
    Provider,
    DEFAULT_MODELS,
    API_KEY_FIELDS,
    get_user_api_key,
    get_chat_model,
    _convert_messages,
    chat_with_model,
)


@pytest.mark.unit
class TestProvider:
    """Test the Provider enum."""
    
    def test_provider_values(self):
        """Test that Provider enum has correct values."""
        assert Provider.OPENAI.value == "openai"
        assert Provider.ANTHROPIC.value == "anthropic"
        assert Provider.GOOGLE.value == "google"
    
    def test_provider_string_conversion(self):
        """Test that Provider can be compared with strings."""
        assert Provider.OPENAI == "openai"
        assert Provider.ANTHROPIC == "anthropic"
        assert Provider.GOOGLE == "google"


@pytest.mark.unit
class TestDefaultModels:
    """Test default model configurations."""
    
    def test_default_models_exist(self):
        """Test that default models are defined for all providers."""
        assert Provider.OPENAI in DEFAULT_MODELS
        assert Provider.ANTHROPIC in DEFAULT_MODELS
        assert Provider.GOOGLE in DEFAULT_MODELS
    
    def test_default_model_values(self):
        """Test the specific default model values."""
        assert DEFAULT_MODELS[Provider.OPENAI] == "gpt-4o"
        assert DEFAULT_MODELS[Provider.ANTHROPIC] == "claude-sonnet-4-20250514"
        assert DEFAULT_MODELS[Provider.GOOGLE] == "gemini-1.5-pro"


@pytest.mark.unit
class TestAPIKeyFields:
    """Test API key field mappings."""
    
    def test_api_key_fields_exist(self):
        """Test that API key fields are defined for all providers."""
        assert Provider.OPENAI in API_KEY_FIELDS
        assert Provider.ANTHROPIC in API_KEY_FIELDS
        assert Provider.GOOGLE in API_KEY_FIELDS
    
    def test_api_key_field_values(self):
        """Test the specific API key field names."""
        assert API_KEY_FIELDS[Provider.OPENAI] == "openai_api_key"
        assert API_KEY_FIELDS[Provider.ANTHROPIC] == "anthropic_api_key"
        assert API_KEY_FIELDS[Provider.GOOGLE] == "google_api_key"


@pytest.mark.unit
class TestGetUserAPIKey:
    """Test get_user_api_key function."""
    
    @pytest.mark.asyncio
    async def test_get_user_api_key_success_openai(
        self, sample_user_id, mock_database, sample_api_keys
    ):
        """Test successfully retrieving OpenAI API key."""
        result = await get_user_api_key(sample_user_id, Provider.OPENAI, mock_database)
        assert result == sample_api_keys["openai"]
    
    @pytest.mark.asyncio
    async def test_get_user_api_key_success_anthropic(
        self, sample_user_id, mock_database, sample_api_keys
    ):
        """Test successfully retrieving Anthropic API key."""
        result = await get_user_api_key(sample_user_id, Provider.ANTHROPIC, mock_database)
        assert result == sample_api_keys["anthropic"]
    
    @pytest.mark.asyncio
    async def test_get_user_api_key_success_google(
        self, sample_user_id, mock_database, sample_api_keys
    ):
        """Test successfully retrieving Google API key."""
        result = await get_user_api_key(sample_user_id, Provider.GOOGLE, mock_database)
        assert result == sample_api_keys["google"]
    
    @pytest.mark.asyncio
    async def test_get_user_api_key_user_not_found(self, sample_user_id, mock_database_no_user):
        """Test that HTTPException is raised when user is not found."""
        with pytest.raises(HTTPException) as exc_info:
            await get_user_api_key(sample_user_id, Provider.OPENAI, mock_database_no_user)
        
        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_get_user_api_key_no_api_key_configured(
        self, sample_user_id, mock_database_no_keys
    ):
        """Test that HTTPException is raised when API key is not configured."""
        with pytest.raises(HTTPException) as exc_info:
            await get_user_api_key(sample_user_id, Provider.OPENAI, mock_database_no_keys)
        
        assert exc_info.value.status_code == 400
        assert "API key for openai is not configured" in exc_info.value.detail
        assert "Please add your API key in settings" in exc_info.value.detail


@pytest.mark.unit
class TestGetChatModel:
    """Test get_chat_model function."""
    
    @pytest.mark.asyncio
    async def test_get_chat_model_openai_default(self, sample_user_id, mock_database):
        """Test creating OpenAI chat model with default model name."""
        with patch("utils.llm.ChatOpenAI") as mock_openai:
            model = await get_chat_model(sample_user_id, Provider.OPENAI, mock_database)
            
            # Verify ChatOpenAI was called with correct parameters
            mock_openai.assert_called_once()
            call_kwargs = mock_openai.call_args.kwargs
            assert "api_key" in call_kwargs
            assert call_kwargs["model"] == DEFAULT_MODELS[Provider.OPENAI]
    
    @pytest.mark.asyncio
    async def test_get_chat_model_openai_custom_model(self, sample_user_id, mock_database):
        """Test creating OpenAI chat model with custom model name."""
        custom_model = "gpt-4-turbo"
        
        with patch("utils.llm.ChatOpenAI") as mock_openai:
            model = await get_chat_model(
                sample_user_id, Provider.OPENAI, mock_database, model_name=custom_model
            )
            
            # Verify ChatOpenAI was called with custom model
            mock_openai.assert_called_once()
            call_kwargs = mock_openai.call_args.kwargs
            assert call_kwargs["model"] == custom_model
    
    @pytest.mark.asyncio
    async def test_get_chat_model_anthropic_default(self, sample_user_id, mock_database):
        """Test creating Anthropic chat model with default model name."""
        with patch("utils.llm.ChatAnthropic") as mock_anthropic:
            model = await get_chat_model(sample_user_id, Provider.ANTHROPIC, mock_database)
            
            # Verify ChatAnthropic was called with correct parameters
            mock_anthropic.assert_called_once()
            call_kwargs = mock_anthropic.call_args.kwargs
            assert "api_key" in call_kwargs
            assert call_kwargs["model"] == DEFAULT_MODELS[Provider.ANTHROPIC]
    
    @pytest.mark.asyncio
    async def test_get_chat_model_anthropic_custom_model(self, sample_user_id, mock_database):
        """Test creating Anthropic chat model with custom model name."""
        custom_model = "claude-3-opus-20240229"
        
        with patch("utils.llm.ChatAnthropic") as mock_anthropic:
            model = await get_chat_model(
                sample_user_id, Provider.ANTHROPIC, mock_database, model_name=custom_model
            )
            
            # Verify ChatAnthropic was called with custom model
            mock_anthropic.assert_called_once()
            call_kwargs = mock_anthropic.call_args.kwargs
            assert call_kwargs["model"] == custom_model
    
    @pytest.mark.asyncio
    async def test_get_chat_model_google_default(self, sample_user_id, mock_database):
        """Test creating Google chat model with default model name."""
        with patch("utils.llm.ChatGoogleGenerativeAI") as mock_google:
            model = await get_chat_model(sample_user_id, Provider.GOOGLE, mock_database)
            
            # Verify ChatGoogleGenerativeAI was called with correct parameters
            mock_google.assert_called_once()
            call_kwargs = mock_google.call_args.kwargs
            assert "google_api_key" in call_kwargs
            assert call_kwargs["model"] == DEFAULT_MODELS[Provider.GOOGLE]
    
    @pytest.mark.asyncio
    async def test_get_chat_model_google_custom_model(self, sample_user_id, mock_database):
        """Test creating Google chat model with custom model name."""
        custom_model = "gemini-1.5-flash"
        
        with patch("utils.llm.ChatGoogleGenerativeAI") as mock_google:
            model = await get_chat_model(
                sample_user_id, Provider.GOOGLE, mock_database, model_name=custom_model
            )
            
            # Verify ChatGoogleGenerativeAI was called with custom model
            mock_google.assert_called_once()
            call_kwargs = mock_google.call_args.kwargs
            assert call_kwargs["model"] == custom_model


@pytest.mark.unit
class TestConvertMessages:
    """Test _convert_messages function."""
    
    def test_convert_user_message(self):
        """Test converting a user message."""
        messages = [{"role": "user", "content": "Hello"}]
        result = _convert_messages(messages)
        
        assert len(result) == 1
        assert isinstance(result[0], HumanMessage)
        assert result[0].content == "Hello"
    
    def test_convert_assistant_message(self):
        """Test converting an assistant message."""
        messages = [{"role": "assistant", "content": "Hi there!"}]
        result = _convert_messages(messages)
        
        assert len(result) == 1
        assert isinstance(result[0], AIMessage)
        assert result[0].content == "Hi there!"
    
    def test_convert_system_message(self):
        """Test converting a system message."""
        messages = [{"role": "system", "content": "You are helpful."}]
        result = _convert_messages(messages)
        
        assert len(result) == 1
        assert isinstance(result[0], SystemMessage)
        assert result[0].content == "You are helpful."
    
    def test_convert_multiple_messages(self, sample_messages):
        """Test converting multiple messages of different types."""
        result = _convert_messages(sample_messages)
        
        assert len(result) == 4
        assert isinstance(result[0], SystemMessage)
        assert isinstance(result[1], HumanMessage)
        assert isinstance(result[2], AIMessage)
        assert isinstance(result[3], HumanMessage)
        
        assert result[0].content == "You are a helpful assistant."
        assert result[1].content == "Hello, how are you?"
        assert result[2].content == "I'm doing well, thank you!"
        assert result[3].content == "What's the weather like?"
    
    def test_convert_unknown_role_defaults_to_human(self):
        """Test that unknown role defaults to HumanMessage."""
        messages = [{"role": "unknown", "content": "Test"}]
        result = _convert_messages(messages)
        
        assert len(result) == 1
        assert isinstance(result[0], HumanMessage)
        assert result[0].content == "Test"
    
    def test_convert_empty_messages(self):
        """Test converting empty message list."""
        messages = []
        result = _convert_messages(messages)
        
        assert len(result) == 0
        assert result == []
    
    def test_convert_message_missing_role(self):
        """Test converting message without role (defaults to user)."""
        messages = [{"content": "Hello"}]
        result = _convert_messages(messages)
        
        assert len(result) == 1
        assert isinstance(result[0], HumanMessage)
        assert result[0].content == "Hello"
    
    def test_convert_message_missing_content(self):
        """Test converting message without content (defaults to empty string)."""
        messages = [{"role": "user"}]
        result = _convert_messages(messages)
        
        assert len(result) == 1
        assert isinstance(result[0], HumanMessage)
        assert result[0].content == ""


@pytest.mark.unit
class TestChatWithModel:
    """Test chat_with_model function."""
    
    @pytest.mark.asyncio
    async def test_chat_with_model_openai(
        self, sample_user_id, mock_database, sample_simple_messages
    ):
        """Test chatting with OpenAI model."""
        expected_response = "Test response from OpenAI"
        
        with patch("utils.llm.get_chat_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.ainvoke = AsyncMock(
                return_value=AIMessage(content=expected_response)
            )
            mock_get_model.return_value = mock_model
            
            content, input_tokens, output_tokens = await chat_with_model(
                sample_user_id, Provider.OPENAI, sample_simple_messages, mock_database
            )
            
            assert content == expected_response
            assert isinstance(input_tokens, int)
            assert isinstance(output_tokens, int)
            mock_get_model.assert_called_once_with(
                sample_user_id, Provider.OPENAI, mock_database, None
            )
            mock_model.ainvoke.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_chat_with_model_anthropic(
        self, sample_user_id, mock_database, sample_simple_messages
    ):
        """Test chatting with Anthropic model."""
        expected_response = "Test response from Anthropic"
        
        with patch("utils.llm.get_chat_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.ainvoke = AsyncMock(
                return_value=AIMessage(content=expected_response)
            )
            mock_get_model.return_value = mock_model
            
            content, input_tokens, output_tokens = await chat_with_model(
                sample_user_id, Provider.ANTHROPIC, sample_simple_messages, mock_database
            )
            
            assert content == expected_response
            assert isinstance(input_tokens, int)
            assert isinstance(output_tokens, int)
            mock_get_model.assert_called_once_with(
                sample_user_id, Provider.ANTHROPIC, mock_database, None
            )
    
    @pytest.mark.asyncio
    async def test_chat_with_model_google(
        self, sample_user_id, mock_database, sample_simple_messages
    ):
        """Test chatting with Google model."""
        expected_response = "Test response from Google"
        
        with patch("utils.llm.get_chat_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.ainvoke = AsyncMock(
                return_value=AIMessage(content=expected_response)
            )
            mock_get_model.return_value = mock_model
            
            content, input_tokens, output_tokens = await chat_with_model(
                sample_user_id, Provider.GOOGLE, sample_simple_messages, mock_database
            )
            
            assert content == expected_response
            assert isinstance(input_tokens, int)
            assert isinstance(output_tokens, int)
            mock_get_model.assert_called_once_with(
                sample_user_id, Provider.GOOGLE, mock_database, None
            )
    
    @pytest.mark.asyncio
    async def test_chat_with_model_custom_model_name(
        self, sample_user_id, mock_database, sample_simple_messages
    ):
        """Test chatting with custom model name."""
        custom_model = "gpt-4-turbo"
        expected_response = "Custom model response"
        
        with patch("utils.llm.get_chat_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.ainvoke = AsyncMock(
                return_value=AIMessage(content=expected_response)
            )
            mock_get_model.return_value = mock_model
            
            content, input_tokens, output_tokens = await chat_with_model(
                sample_user_id,
                Provider.OPENAI,
                sample_simple_messages,
                mock_database,
                model_name=custom_model,
            )
            
            assert content == expected_response
            assert isinstance(input_tokens, int)
            assert isinstance(output_tokens, int)
            mock_get_model.assert_called_once_with(
                sample_user_id, Provider.OPENAI, mock_database, custom_model
            )
    
    @pytest.mark.asyncio
    async def test_chat_with_model_multiple_messages(
        self, sample_user_id, mock_database, sample_messages
    ):
        """Test chatting with multiple messages in conversation."""
        expected_response = "Response to conversation"
        
        with patch("utils.llm.get_chat_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.ainvoke = AsyncMock(
                return_value=AIMessage(content=expected_response)
            )
            mock_get_model.return_value = mock_model
            
            content, input_tokens, output_tokens = await chat_with_model(
                sample_user_id, Provider.OPENAI, sample_messages, mock_database
            )
            
            assert content == expected_response
            assert isinstance(input_tokens, int)
            assert isinstance(output_tokens, int)
            
            # Verify ainvoke was called with converted messages
            mock_model.ainvoke.assert_called_once()
            call_args = mock_model.ainvoke.call_args[0][0]
            assert len(call_args) == 4
            assert isinstance(call_args[0], SystemMessage)
            assert isinstance(call_args[1], HumanMessage)
            assert isinstance(call_args[2], AIMessage)
            assert isinstance(call_args[3], HumanMessage)
    
    @pytest.mark.asyncio
    async def test_chat_with_model_propagates_exceptions(
        self, sample_user_id, mock_database_no_user, sample_simple_messages
    ):
        """Test that exceptions from get_user_api_key are propagated."""
        with pytest.raises(HTTPException) as exc_info:
            await chat_with_model(
                sample_user_id, Provider.OPENAI, sample_simple_messages, mock_database_no_user
            )
        
        assert exc_info.value.status_code == 404

