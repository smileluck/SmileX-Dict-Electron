from pydantic import BaseModel
from typing import Optional


class DictItem(BaseModel):
    id: str
    name: str
    wordCount: int = 0
    source: str = "custom"
    isOfficial: bool = False
    description: Optional[str] = None


class DictCreate(BaseModel):
    name: str
    wordCount: int = 0


class DictUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
