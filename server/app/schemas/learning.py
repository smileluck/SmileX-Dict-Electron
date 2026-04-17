from pydantic import BaseModel, Field
from typing import Optional


class LearningProgress(BaseModel):
    id: str
    user_id: str
    word_id: str
    status: str = "new"
    efactor: float = 2.5
    interval: int = 0
    next_review_date: Optional[str] = None
    last_review_date: Optional[str] = None
    repetitions: int = 0
    difficulty: int = 3
    importance: int = 2
    category: str = "general"
    learning_streak: int = 0
    average_quality: float = 0.0
    last_response_quality: float = 0.0
    fatigue_factor: float = 1.0
    response_time: int = 0
    contextual_reviews: int = 0


class LearningProgressUpdate(BaseModel):
    status: Optional[str] = None
    efactor: Optional[float] = None
    interval: Optional[int] = None
    next_review_date: Optional[str] = None
    last_review_date: Optional[str] = None
    repetitions: Optional[int] = None
    difficulty: Optional[int] = None
    importance: Optional[int] = None
    category: Optional[str] = None
    learning_streak: Optional[int] = None
    average_quality: Optional[float] = None
    last_response_quality: Optional[float] = None
    fatigue_factor: Optional[float] = None
    response_time: Optional[int] = None
    contextual_reviews: Optional[int] = None


class ReviewWordRequest(BaseModel):
    quality: float = Field(ge=0, le=6)
    response_time: Optional[int] = None
    learning_context: Optional[str] = "recall"
