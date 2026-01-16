from enum import Enum
from typing import Any

import tiktoken
from bson import ObjectId
from fastapi import HTTPException, status
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from utils.encryption import decrypt_api_key
from utils.model_config import get_model_context_limit


class Provider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"


# Default models for each provider
DEFAULT_MODELS = {
    Provider.OPENAI: "gpt-4o",
    Provider.ANTHROPIC: "claude-sonnet-4-20250514",
    Provider.GOOGLE: "gemini-1.5-pro",
}

# Mapping of provider to API key field name in database
API_KEY_FIELDS = {
    Provider.OPENAI: "openai_api_key",
    Provider.ANTHROPIC: "anthropic_api_key",
    Provider.GOOGLE: "google_api_key",
}

# Default system prompt for all conversations
DEFAULT_SYSTEM_PROMPT = """You are a helpful assistant.

Respond using clean, well-structured Markdown.

CRITICAL: When providing code examples, code snippets, or any code-related content, you MUST use fenced code blocks with triple backticks (```). Always specify the programming language after the opening backticks.

Example of correct code formatting:
User: "How do I create a function in Python?"
Assistant: "Here's how you can create a function in Python:

```python
def greet(name):
    return f"Hello, {name}!"

# Usage
result = greet("World")
print(result)
```

This function takes a name parameter and returns a greeting message."

Formatting rules:

Use clear section headings (##, ###) when helpful

Use bullet points for lists

Use numbered lists for step-by-step instructions

Highlight important terms using bold

Use blockquotes (>) for insights, notes, or warnings

Use tables when comparing multiple items

Use checkboxes (- [ ]) for action items or tasks

When providing code:
- ALWAYS use fenced code blocks with triple backticks (```)
- ALWAYS specify the language (e.g., ```js, ```ts, ```python, ```bash, ```json)
- Keep code minimal, correct, and relevant
- Add brief explanations outside the code block

Keep paragraphs short and scannable

Add whitespace between sections

Do NOT use HTML

Do NOT mention Markdown explicitly in the response

Content rules:

Be clear, concise, and helpful

Structure the response based on the question type

If the question is ambiguous, make reasonable assumptions and proceed

Avoid unnecessary verbosity

Prefer examples when explaining technical concepts

Always prioritize readability and clarity."""


async def get_user_api_key(user_id: str, provider: Provider, db: Any) -> str:
    """
    Fetch and decrypt the user's API key for the specified provider.
    
    Args:
        user_id: The user's ID
        provider: The LLM provider (openai, anthropic, google)
        db: Database instance
        
    Returns:
        Decrypted API key string
        
    Raises:
        HTTPException: If user not found or API key not configured
    """
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    api_keys = user.get("api_keys", {})
    key_field = API_KEY_FIELDS[provider]
    encrypted_key = api_keys.get(key_field)
    
    if not encrypted_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key for {provider.value} is not configured. Please add your API key in settings."
        )
    
    return decrypt_api_key(encrypted_key)


async def get_chat_model(
    user_id: str,
    provider: Provider,
    db: Any,
    model_name: str | None = None
) -> ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI:
    """
    Get a configured LangChain chat model for the specified provider.
    
    Args:
        user_id: The user's ID
        provider: The LLM provider (openai, anthropic, google)
        db: Database instance
        model_name: Optional specific model name (uses default if not provided)
        
    Returns:
        Configured LangChain chat model instance
    """
    api_key = await get_user_api_key(user_id, provider, db)
    model = model_name or DEFAULT_MODELS[provider]
    
    if provider == Provider.OPENAI:
        return ChatOpenAI(
            api_key=api_key,
            model=model
        )
    elif provider == Provider.ANTHROPIC:
        return ChatAnthropic(
            api_key=api_key,
            model=model
        )
    elif provider == Provider.GOOGLE:
        return ChatGoogleGenerativeAI(
            google_api_key=api_key,
            model=model
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}"
        )


def _convert_messages(messages: list[dict]) -> list[HumanMessage | AIMessage | SystemMessage]:
    """
    Convert a list of message dictionaries to LangChain message objects.
    
    Args:
        messages: List of dicts with 'role' and 'content' keys
                  role can be: 'user', 'assistant', 'system'
                  
    Returns:
        List of LangChain message objects
    """
    langchain_messages = []
    
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "user":
            langchain_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            langchain_messages.append(AIMessage(content=content))
        elif role == "system":
            langchain_messages.append(SystemMessage(content=content))
        else:
            # Default to human message for unknown roles
            langchain_messages.append(HumanMessage(content=content))
    
    return langchain_messages


async def chat_with_model(
    user_id: str,
    provider: Provider,
    messages: list[dict],
    db: Any,
    model_name: str | None = None
) -> tuple[str, int, int]:
    """
    Send messages to the chat model and get a response with token usage.
    
    Args:
        user_id: The user's ID
        provider: The LLM provider (openai, anthropic, google)
        messages: List of message dicts with 'role' and 'content' keys
                  Example: [{"role": "user", "content": "Hello!"}]
        db: Database instance
        model_name: Optional specific model name
        
    Returns:
        Tuple of (response_content, input_tokens, output_tokens)
    """
    chat_model = await get_chat_model(user_id, provider, db, model_name)
    
    # Prepend system prompt if no system message exists
    messages_with_system = messages.copy()
    has_system_message = any(msg.get("role") == "system" for msg in messages_with_system)
    
    if not has_system_message:
        messages_with_system.insert(0, {
            "role": "system",
            "content": DEFAULT_SYSTEM_PROMPT
        })
    
    langchain_messages = _convert_messages(messages_with_system)
    
    response = await chat_model.ainvoke(langchain_messages)
    
    # Extract token usage from API response metadata
    input_tokens = 0
    output_tokens = 0
    
    if hasattr(response, 'response_metadata'):
        metadata = response.response_metadata
        
        # OpenAI format
        if 'token_usage' in metadata:
            usage = metadata['token_usage']
            input_tokens = usage.get('prompt_tokens', 0)
            output_tokens = usage.get('completion_tokens', 0)
        # Anthropic format
        elif 'usage' in metadata:
            usage = metadata['usage']
            input_tokens = usage.get('input_tokens', 0)
            output_tokens = usage.get('output_tokens', 0)
        # Google format
        elif 'usage_metadata' in metadata:
            usage = metadata['usage_metadata']
            input_tokens = usage.get('prompt_token_count', 0)
            output_tokens = usage.get('candidates_token_count', 0)
    
    return response.content, input_tokens, output_tokens


def count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    """
    Count the number of tokens in a text string using tiktoken.
    
    Args:
        text: The text to count tokens for
        model: The model name to get the correct encoding (default: gpt-4o-mini)
        
    Returns:
        Number of tokens in the text
    """
    try:
        # Get the encoding for the model
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # If model not found, use cl100k_base (used by gpt-4, gpt-3.5-turbo)
        encoding = tiktoken.get_encoding("cl100k_base")
    
    return len(encoding.encode(text))


def count_messages_tokens(messages: list[dict], model: str = "gpt-4o-mini") -> int:
    """
    Count total tokens in a list of messages.
    
    Args:
        messages: List of message dicts with 'role' and 'content' keys
        model: The model name for tokenization
        
    Returns:
        Total number of tokens across all messages (including formatting overhead)
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    
    total_tokens = 0
    
    for message in messages:
        # Count tokens in content
        content = message.get("content", "")
        total_tokens += len(encoding.encode(content))
        
        # Add overhead for message formatting (role, etc.)
        # OpenAI uses ~4 tokens per message for formatting
        total_tokens += 4
        
        # Add tokens for role
        role = message.get("role", "user")
        total_tokens += len(encoding.encode(role))
    
    # Add 2 tokens for reply priming
    total_tokens += 2
    
    return total_tokens


def calculate_context_metrics(total_tokens_used: int, model_name: str) -> dict:
    """
    Calculate context window usage metrics for a conversation.
    
    Args:
        total_tokens_used: Total tokens used in conversation
        model_name: The model name to get context limit
        
    Returns:
        Dict with context metrics:
        - total_context_size: Max context window
        - remaining_context_size: Tokens remaining
        - total_used_percentage: Percentage used
        - remaining_percentage: Percentage remaining
    """
    total_context_size = get_model_context_limit(model_name)
    remaining_context_size = max(0, total_context_size - total_tokens_used)
    
    total_used_percentage = (total_tokens_used / total_context_size) * 100
    remaining_percentage = (remaining_context_size / total_context_size) * 100
    
    return {
        "total_context_size": total_context_size,
        "remaining_context_size": remaining_context_size,
        "total_used_percentage": round(total_used_percentage, 2),
        "remaining_percentage": round(remaining_percentage, 2)
    }


def get_messages_within_token_limit(
    messages: list[dict],
    token_limit: int,
    model: str = "gpt-4o-mini"
) -> list[dict]:
    """
    Get the most recent messages that fit within the token limit.
    
    Args:
        messages: List of message dicts with 'role' and 'content' keys
        token_limit: Maximum number of tokens to include
        model: The model name for tokenization
        
    Returns:
        List of messages (from most recent) that fit within token limit
    """
    if not messages:
        return []
    
    # Start from the most recent message and work backwards
    selected_messages = []
    current_tokens = 0
    
    # Iterate through messages in reverse order (most recent first)
    for message in reversed(messages):
        # Calculate tokens for this message
        message_tokens = count_messages_tokens([message], model)
        
        # Check if adding this message would exceed the limit
        if current_tokens + message_tokens > token_limit:
            # If we haven't selected any messages yet, include at least the most recent one
            if not selected_messages:
                selected_messages.append(message)
            break
        
        selected_messages.append(message)
        current_tokens += message_tokens
    
    # Reverse to get chronological order
    return list(reversed(selected_messages))


async def generate_title_from_message(
    content: str,
    user_id: str,
    provider: Provider,
    db: Any
) -> str:
    """
    Generate a concise, descriptive title for a conversation using LLM.
    
    Args:
        content: The first message content
        user_id: The user's ID (for API key access)
        provider: The LLM provider to use for title generation
        db: Database instance
        
    Returns:
        Generated title (max 60 characters)
    """
    try:
        # Use gpt-4o-mini for cost-efficient title generation
        title_model = "gpt-4o-mini"
        
        # Create a prompt for title generation
        prompt = f"Generate a short, descriptive title (maximum 60 characters) for a conversation that starts with this message: \"{content}\"\n\nRespond with ONLY the title, nothing else."
        
        # Get chat model
        chat_model = await get_chat_model(user_id, provider, db, title_model)
        
        # Generate title
        messages = [HumanMessage(content=prompt)]
        response = await chat_model.ainvoke(messages)
        
        # Clean up the response
        title = response.content.strip()
        
        # Remove quotes if present
        if title.startswith('"') and title.endswith('"'):
            title = title[1:-1]
        if title.startswith("'") and title.endswith("'"):
            title = title[1:-1]
        
        # Ensure it's not too long
        if len(title) > 60:
            title = title[:57] + "..."
        
        return title
        
    except Exception as e:
        # Fallback to simple truncation if LLM fails
        if len(content) <= 60:
            return content
        else:
            # Find the last complete word within 57 characters
            truncated = content[:57]
            last_space = truncated.rfind(' ')
            if last_space > 30:  # Only truncate at word boundary if reasonable
                return truncated[:last_space] + "..."
            return truncated + "..."

