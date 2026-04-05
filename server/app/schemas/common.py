from typing import List, Optional

from pydantic import BaseModel

from app.schemas.article import ArticleItem
from app.schemas.dict import DictItem
from app.schemas.settings import UserSettings
from app.schemas.stat import StatItem
from app.schemas.word import WordItem


class ExportData(BaseModel):
    dicts: List[DictItem] = []
    words: List[WordItem] = []
    articles: List[ArticleItem] = []
    stats: List[StatItem] = []
    settings: Optional[UserSettings] = None
