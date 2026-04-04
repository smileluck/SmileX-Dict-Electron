from pydantic import BaseModel, Field
from typing import Optional


class ArticleItem(BaseModel):
    id: str
    title: str
    content: str
    contentZh: Optional[str] = None
    type: str = Field(default="article")


class ArticleCreate(BaseModel):
    title: str
    content: str
    contentZh: Optional[str] = None
    type: str = "article"
