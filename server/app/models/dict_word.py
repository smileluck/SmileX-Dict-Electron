from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base


class DictWordModel(Base):
    __tablename__ = "dict_words"
    __table_args__ = (
        UniqueConstraint("dict_id", "word_id", name="uq_dict_word"),
        {"sqlite_autoincrement": True},
    )

    id = Column(String, primary_key=True)
    dict_id = Column(String, ForeignKey("dicts.id"), nullable=False, index=True)
    word_id = Column(String, ForeignKey("words.id"), nullable=False, index=True)
    sort_order = Column(Integer, default=0)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
