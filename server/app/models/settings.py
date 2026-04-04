from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class UserSettingsModel(Base):
    __tablename__ = "user_settings"

    userId = Column(String, ForeignKey("users.id"), primary_key=True)
    username = Column(String, unique=True, nullable=False)
    practiceMode = Column(String, default="zh-en")
    dailyNewWordTarget = Column(Integer, default=20)
    lastUpdateAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
