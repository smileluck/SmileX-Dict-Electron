from sqlalchemy import Column, ForeignKey, String, Text

from app.database import Base


class ArticleItemModel(Base):
    __tablename__ = "articles"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    contentZh = Column(Text)
    type = Column(String, default="article")
    userId = Column(String, ForeignKey("users.id"), nullable=False, index=True)
