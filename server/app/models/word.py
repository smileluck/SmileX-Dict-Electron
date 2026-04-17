from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, UniqueConstraint

from app.database import Base


class WordModel(Base):
    __tablename__ = "words"
    __table_args__ = (
        UniqueConstraint("term", name="uq_words_term"),
        {"sqlite_autoincrement": True},
    )

    id = Column(String, primary_key=True)
    term = Column(String, nullable=False, index=True)
    ipa = Column(String)
    phonetic_uk = Column(String)
    phonetic_us = Column(String)
    phonetic_uk_url = Column(String)
    phonetic_us_url = Column(String)
    level = Column(String)
    tags = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
