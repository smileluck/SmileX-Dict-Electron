from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.database import Base


class WordMeaningModel(Base):
    __tablename__ = "word_meanings"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id = Column(String, primary_key=True)
    word_id = Column(String, ForeignKey("words.id"), nullable=False, index=True)
    properties = Column(String)
    description = Column(Text)
    description_en = Column(Text)
    scene = Column(String)
    from_type = Column(String)
    synonym_ids = Column(String)
    synonym_words = Column(String)
    sort_order = Column(Integer, default=0)
