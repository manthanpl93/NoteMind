from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.model_config import MODEL_CONFIGS
from models.ai_model import AIModelResponse, AIModelsListResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=AIModelsListResponse)
async def get_models(current_user: dict = Depends(get_current_user)):
    """
    Get all supported AI models.

    Returns a list of all AI models supported by the system, including
    their identifiers, display names, and providers.

    Requires authentication.
    """
    models = []
    for model_key, model_info in MODEL_CONFIGS.items():
        model = AIModelResponse(
            id=str(model_key),
            name=model_info.name,
            provider=model_info.provider
        )
        models.append(model)

    return AIModelsListResponse(models=models)
