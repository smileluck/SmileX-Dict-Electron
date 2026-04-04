from pydantic import BaseModel
from typing import Optional


class UserSettings(BaseModel):
    userId: str
    username: str
    practiceMode: Optional[str] = "zh-en"
    dailyNewWordTarget: int = 20


class UserSettingsUpdate(BaseModel):
    username: Optional[str] = None
    dailyNewWordTarget: Optional[int] = None
