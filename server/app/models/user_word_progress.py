from sqlalchemy import Column, Float, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base


class UserWordProgressModel(Base):
    __tablename__ = "user_word_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word"),
        {"sqlite_autoincrement": True},
    )

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    word_id = Column(String, ForeignKey("words.id"), nullable=False, index=True)
    status = Column(String, default="new")
    efactor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    next_review_date = Column(String)
    last_review_date = Column(String)
    repetitions = Column(Integer, default=0)
    difficulty = Column(Integer, default=3)
    importance = Column(Integer, default=2)
    category = Column(String, default="general")
    learning_streak = Column(Integer, default=0)
    average_quality = Column(Float, default=0.0)
    last_response_quality = Column(Float, default=0.0)
    fatigue_factor = Column(Float, default=1.0)
    response_time = Column(Integer, default=0)
    contextual_reviews = Column(Integer, default=0)
