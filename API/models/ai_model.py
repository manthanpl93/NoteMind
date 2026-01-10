from pydantic import BaseModel
from typing import List


class AIModelResponse(BaseModel):
    """Response model for an individual AI model."""
    id: str
    name: str
    provider: str


class AIModelsListResponse(BaseModel):
    """Response model for a list of AI models."""
    models: List[AIModelResponse]
