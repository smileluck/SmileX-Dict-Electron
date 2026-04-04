from pydantic import BaseModel


class StatItem(BaseModel):
    date: str
    newCount: int
    reviewCount: int
    dictationCount: int
    wrongCount: int = 0


class StatEvent(BaseModel):
    type: str
