from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class WordPhraseModel(Base):
    __tablename__ = "word_phrases"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id = Column(String, primary_key=True)
    word_id = Column(String, ForeignKey("words.id"), nullable=False, index=True)
    word_text = Column(String)
    word_desc = Column(String)
    to_word_id = Column(String)
    sort_order = Column(Integer, default=0)
