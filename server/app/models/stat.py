from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class DailyStatModel(Base):
    __tablename__ = "daily_stats"

    date = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("users.id"), primary_key=True)
    newCount = Column(Integer, default=0)
    reviewCount = Column(Integer, default=0)
    dictationCount = Column(Integer, default=0)
    wrongCount = Column(Integer, default=0)
