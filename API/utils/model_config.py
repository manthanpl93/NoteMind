from enum import Enum
from dataclasses import dataclass


@dataclass
class ModelInfo:
    """Information about an LLM model."""
    name: str
    context_limit: int
    provider: str
    cost_per_1k_input: float  # For future cost tracking
    cost_per_1k_output: float


class OpenAIModels(str, Enum):
    """OpenAI model identifiers."""
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_3_5_TURBO = "gpt-3.5-turbo"


class AnthropicModels(str, Enum):
    """Anthropic model identifiers."""
    CLAUDE_SONNET_4 = "claude-sonnet-4-20250514"
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20241022"
    CLAUDE_3_OPUS = "claude-3-opus-20240229"


class GoogleModels(str, Enum):
    """Google model identifiers."""
    GEMINI_1_5_PRO = "gemini-1.5-pro"
    GEMINI_1_5_FLASH = "gemini-1.5-flash"
    GEMINI_1_0_PRO = "gemini-1.0-pro"


MODEL_CONFIGS = {
    # OpenAI models
    OpenAIModels.GPT_4O: ModelInfo("gpt-4o", 128000, "openai", 0.0025, 0.01),
    OpenAIModels.GPT_4O_MINI: ModelInfo("gpt-4o-mini", 128000, "openai", 0.00015, 0.0006),
    OpenAIModels.GPT_4_TURBO: ModelInfo("gpt-4-turbo", 128000, "openai", 0.01, 0.03),
    OpenAIModels.GPT_3_5_TURBO: ModelInfo("gpt-3.5-turbo", 16385, "openai", 0.0005, 0.0015),
    
    # Anthropic models
    AnthropicModels.CLAUDE_SONNET_4: ModelInfo("claude-sonnet-4-20250514", 200000, "anthropic", 0.003, 0.015),
    AnthropicModels.CLAUDE_3_5_SONNET: ModelInfo("claude-3-5-sonnet-20241022", 200000, "anthropic", 0.003, 0.015),
    AnthropicModels.CLAUDE_3_OPUS: ModelInfo("claude-3-opus-20240229", 200000, "anthropic", 0.015, 0.075),
    
    # Google models
    GoogleModels.GEMINI_1_5_PRO: ModelInfo("gemini-1.5-pro", 2000000, "google", 0.00125, 0.005),
    GoogleModels.GEMINI_1_5_FLASH: ModelInfo("gemini-1.5-flash", 1000000, "google", 0.000075, 0.0003),
    GoogleModels.GEMINI_1_0_PRO: ModelInfo("gemini-1.0-pro", 32768, "google", 0.0005, 0.0015),
}


def get_model_context_limit(model_name: str) -> int:
    """
    Get context limit for a model.
    
    Args:
        model_name: Name of the model
        
    Returns:
        Context limit in tokens, or 4000 as default fallback
    """
    for model_config in MODEL_CONFIGS.values():
        if model_config.name == model_name:
            return model_config.context_limit
    return 4000  # Default fallback


def get_model_info(model_name: str) -> ModelInfo | None:
    """
    Get full model information.
    
    Args:
        model_name: Name of the model
        
    Returns:
        ModelInfo object or None if model not found
    """
    for model_config in MODEL_CONFIGS.values():
        if model_config.name == model_name:
            return model_config
    return None


