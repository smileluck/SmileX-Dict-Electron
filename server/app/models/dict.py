from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class DictModel(Base):
    __tablename__ = "dicts"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    cover_url = Column(String)
    source = Column(String, default="custom")
    is_official = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
