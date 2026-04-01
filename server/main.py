from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from .db import engine, SessionLocal, Base
from .models import DictItemModel, WordItemModel, ArticleItemModel, DailyStatModel

app = FastAPI(title="SmileX Dict Admin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DictItem(BaseModel):
    id: str
    name: str
    wordCount: int = 0
    source: str = "custom"

class WordItem(BaseModel):
    id: str
    term: str
    ipa: Optional[str] = None
    meaning: str
    example: Optional[str] = None
    synonyms: List[str] = []
    synonymsNote: Optional[str] = None
    status: str = Field(default="new")
    dictId: Optional[str] = None

class ArticleItem(BaseModel):
    id: str
    title: str
    content: str
    contentZh: Optional[str] = None
    type: str = Field(default="article")

class DictCreate(BaseModel):
    name: str
    wordCount: int = 0

@app.get("/api/dicts", response_model=List[DictItem])
def list_dicts(db: Session = next(get_db())):
    rows = db.query(DictItemModel).all()
    return [DictItem(id=r.id, name=r.name, wordCount=r.wordCount, source=r.source) for r in rows]

@app.post("/api/dicts", response_model=DictItem)
def create_dict(payload: DictCreate, db: Session = next(get_db())):
    item = DictItemModel(id=f"d{db.query(DictItemModel).count()+1}", name=payload.name, wordCount=payload.wordCount, source="custom")
    db.add(item)
    db.commit()
    return DictItem(id=item.id, name=item.name, wordCount=item.wordCount, source=item.source)

@app.get("/api/words", response_model=List[WordItem])
def list_words(dictId: Optional[str] = None, db: Session = next(get_db())):
    q = db.query(WordItemModel)
    if dictId:
        q = q.filter(WordItemModel.dictId == dictId)
    rows = q.all()
    res = []
    for r in rows:
        syn = []
        if r.synonyms:
            try:
                syn = r.synonyms.split(",")
            except:
                syn = []
        res.append(WordItem(id=r.id, term=r.term, ipa=r.ipa, meaning=r.meaning, example=r.example, synonyms=syn, synonymsNote=r.synonymsNote, status=r.status, dictId=r.dictId))
    return res

@app.post("/api/words", response_model=WordItem)
def create_word(word: WordItem, db: Session = next(get_db())):
    synonyms = ",".join(word.synonyms or [])
    item = WordItemModel(id=word.id, term=word.term, ipa=word.ipa, meaning=word.meaning, example=word.example, synonyms=synonyms, synonymsNote=word.synonymsNote, status=word.status, dictId=word.dictId)
    db.add(item)
    db.commit()
    return word

@app.get("/api/articles", response_model=List[ArticleItem])
def list_articles(db: Session = next(get_db())):
    rows = db.query(ArticleItemModel).all()
    return [ArticleItem(id=r.id, title=r.title, content=r.content, contentZh=r.contentZh, type=r.type) for r in rows]

class ArticleCreate(BaseModel):
    title: str
    content: str
    contentZh: Optional[str] = None
    type: str = "article"

@app.post("/api/articles", response_model=ArticleItem)
def create_article(payload: ArticleCreate, db: Session = next(get_db())):
    item = ArticleItemModel(id=f"a{db.query(ArticleItemModel).count()+1}", title=payload.title, content=payload.content, contentZh=payload.contentZh, type=payload.type)
    db.add(item)
    db.commit()
    return ArticleItem(id=item.id, title=item.title, content=item.content, contentZh=item.contentZh, type=item.type)

class StatItem(BaseModel):
    date: str
    newCount: int
    reviewCount: int
    dictationCount: int

class StatEvent(BaseModel):
    type: str

def today_str():
    from datetime import date
    return date.today().isoformat()

@app.get("/api/stats/today", response_model=StatItem)
def get_today(db: Session = next(get_db())):
    t = today_str()
    row = db.get(DailyStatModel, t)
    if not row:
        row = DailyStatModel(date=t, newCount=0, reviewCount=0, dictationCount=0)
        db.add(row)
        db.commit()
    return StatItem(date=row.date, newCount=row.newCount, reviewCount=row.reviewCount, dictationCount=row.dictationCount)

@app.post("/api/stats/event", response_model=StatItem)
def add_event(ev: StatEvent, db: Session = next(get_db())):
    t = today_str()
    row = db.get(DailyStatModel, t)
    if not row:
        row = DailyStatModel(date=t, newCount=0, reviewCount=0, dictationCount=0)
        db.add(row)
    if ev.type == "new":
        row.newCount += 1
    elif ev.type == "review":
        row.reviewCount += 1
    elif ev.type == "dictation":
        row.dictationCount += 1
    db.commit()
    return StatItem(date=row.date, newCount=row.newCount, reviewCount=row.reviewCount, dictationCount=row.dictationCount)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)