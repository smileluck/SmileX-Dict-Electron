from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class DictItemModel(Base):
    __tablename__ = "dicts"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    wordCount = Column(Integer, default=0)
    source = Column(String, default="custom")

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

class ArticleItemModel(Base):
    __tablename__ = "articles"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    contentZh = Column(Text)
    type = Column(String, default="article")

class DailyStatModel(Base):
    __tablename__ = "daily_stats"
    date = Column(String, primary_key=True)
    newCount = Column(Integer, default=0)
    reviewCount = Column(Integer, default=0)
    dictationCount = Column(Integer, default=0)