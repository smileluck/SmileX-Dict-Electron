from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class DictItemModel(Base):
    __tablename__ = "dicts"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    wordCount = Column(Integer, default=0)
    source = Column(String, default="custom")
    userId = Column(String, ForeignKey("users.id"), nullable=False, index=True)
