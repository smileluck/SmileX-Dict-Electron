from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from db import Base


class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DictItemModel(Base):
    __tablename__ = "dicts"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    wordCount = Column(Integer, default=0)
    source = Column(String, default="custom")
    userId = Column(String, ForeignKey("users.id"), nullable=False)


class WordItemModel(Base):
    __tablename__ = "words"
    id = Column(String, primary_key=True)
    term = Column(String, nullable=False)
    ipa = Column(String)
    meaning = Column(Text, nullable=False)
    enMeaning = Column(Text)
    example = Column(Text)
    synonyms = Column(Text)
    synonymsNote = Column(Text)
    status = Column(String, default="new")
    dictId = Column(String, ForeignKey("dicts.id"))
    userId = Column(String, ForeignKey("users.id"), nullable=False)

    # Enhanced SM2 algorithm fields
    efactor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    nextReviewDate = Column(
        String, default=lambda: datetime.now(timezone.utc).isoformat()
    )
    lastReviewDate = Column(String)
    repetitions = Column(Integer, default=0)

    # New enhanced fields for better learning
    difficulty = Column(Integer, default=3)  # 1-5 difficulty level
    importance = Column(
        Integer, default=2
    )  # 1-3 importance level (basic/essential/advanced)
    category = Column(
        String, default="general"
    )  # vocabulary category (academic/daily/professional etc.)
    learningStreak = Column(Integer, default=0)  # consecutive learning sessions
    averageQuality = Column(Float, default=0.0)  # average response quality (0-6)
    lastResponseQuality = Column(Float, default=0.0)  # last response quality
    fatigueFactor = Column(Float, default=1.0)  # learning fatigue factor (0-1)
    responseTime = Column(Integer, default=0)  # average response time in milliseconds
    contextualReviews = Column(Integer, default=0)  # number of context-based reviews


class ArticleItemModel(Base):
    __tablename__ = "articles"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    contentZh = Column(Text)
    type = Column(String, default="article")
    userId = Column(String, ForeignKey("users.id"), nullable=False)


class DailyStatModel(Base):
    __tablename__ = "daily_stats"
    date = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("users.id"), primary_key=True)
    newCount = Column(Integer, default=0)
    reviewCount = Column(Integer, default=0)
    dictationCount = Column(Integer, default=0)
    wrongCount = Column(Integer, default=0)


class UserSettingsModel(Base):
    __tablename__ = "user_settings"
    userId = Column(String, ForeignKey("users.id"), primary_key=True)
    username = Column(String, unique=True, nullable=False)
    practiceMode = Column(String, default="zh-en")
    dailyNewWordTarget = Column(Integer, default=20)
    lastUpdateAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
