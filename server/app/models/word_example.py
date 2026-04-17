from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.database import Base


class WordExampleModel(Base):
    __tablename__ = "word_examples"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id = Column(String, primary_key=True)
    word_id = Column(String, ForeignKey("words.id"), nullable=False, index=True)
    sentence = Column(Text)
    translation = Column(Text)
    from_type = Column(String)
    ref = Column(String)
    audio_url = Column(String)
    sort_order = Column(Integer, default=0)
