from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
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
    example = Column(Text)
    synonyms = Column(Text)
    synonymsNote = Column(Text)
    status = Column(String, default="new")
    dictId = Column(String, ForeignKey("dicts.id"))
    userId = Column(String, ForeignKey("users.id"), nullable=False)


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
