from datetime import datetime, timezone

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text

from app.database import Base


class WordItemModel(Base):
    __tablename__ = "words"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id = Column(String, primary_key=True)
    term = Column(String, nullable=False, index=True)
    ipa = Column(String)
    meaning = Column(Text, nullable=False)
    enMeaning = Column(Text)
    example = Column(Text)
    synonyms = Column(Text)
    synonymsNote = Column(Text)
    status = Column(String, default="new")
    dictId = Column(String, ForeignKey("dicts.id"), index=True)
    userId = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    efactor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    nextReviewDate = Column(
        String, default=lambda: datetime.now(timezone.utc).isoformat()
    )
    lastReviewDate = Column(String)
    repetitions = Column(Integer, default=0)

    difficulty = Column(Integer, default=3)
    importance = Column(Integer, default=2)
    category = Column(String, default="general")
    learningStreak = Column(Integer, default=0)
    averageQuality = Column(Float, default=0.0)
    lastResponseQuality = Column(Float, default=0.0)
    fatigueFactor = Column(Float, default=1.0)
    responseTime = Column(Integer, default=0)
    contextualReviews = Column(Integer, default=0)
