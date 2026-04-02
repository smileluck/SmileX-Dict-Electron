import uuid
from datetime import date
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from db import engine, SessionLocal, Base
from models import UserModel, DictItemModel, WordItemModel, ArticleItemModel, DailyStatModel
from auth import hash_password, verify_password, create_access_token, get_current_user

app = FastAPI(title="SmileX Dict Admin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Auth Schemas ---

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=64)

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: str
    username: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=AuthResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(payload.password)
    user = UserModel(id=user_id, username=payload.username, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.id})
    return AuthResponse(
        access_token=token,
        user=UserOut(id=user.id, username=user.username),
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(data={"sub": user.id})
    return AuthResponse(
        access_token=token,
        user=UserOut(id=user.id, username=user.username),
    )


@app.get("/api/auth/me", response_model=UserOut)
def get_me(current_user: UserModel = Depends(get_current_user)):
    return UserOut(id=current_user.id, username=current_user.username)


# --- Dict Schemas ---

class DictItem(BaseModel):
    id: str
    name: str
    wordCount: int = 0
    source: str = "custom"

class DictCreate(BaseModel):
    name: str
    wordCount: int = 0


# --- Dict Endpoints ---

@app.get("/api/dicts", response_model=List[DictItem])
def list_dicts(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(DictItemModel).filter(DictItemModel.userId == current_user.id).all()
    return [DictItem(id=r.id, name=r.name, wordCount=r.wordCount, source=r.source) for r in rows]


@app.post("/api/dicts", response_model=DictItem)
def create_dict(payload: DictCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(DictItemModel).filter(DictItemModel.userId == current_user.id).count()
    item = DictItemModel(id=f"d{count+1}", name=payload.name, wordCount=payload.wordCount, source="custom", userId=current_user.id)
    db.add(item)
    db.commit()
    return DictItem(id=item.id, name=item.name, wordCount=item.wordCount, source=item.source)


# --- Word Schemas ---

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


# --- Word Endpoints ---

@app.get("/api/words", response_model=List[WordItem])
def list_words(dictId: Optional[str] = None, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(WordItemModel).filter(WordItemModel.userId == current_user.id)
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
def create_word(word: WordItem, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    synonyms = ",".join(word.synonyms or [])
    item = WordItemModel(id=word.id, term=word.term, ipa=word.ipa, meaning=word.meaning, example=word.example, synonyms=synonyms, synonymsNote=word.synonymsNote, status=word.status, dictId=word.dictId, userId=current_user.id)
    db.add(item)
    db.commit()
    return word


# --- Article Schemas ---

class ArticleItem(BaseModel):
    id: str
    title: str
    content: str
    contentZh: Optional[str] = None
    type: str = Field(default="article")

class ArticleCreate(BaseModel):
    title: str
    content: str
    contentZh: Optional[str] = None
    type: str = "article"


# --- Article Endpoints ---

@app.get("/api/articles", response_model=List[ArticleItem])
def list_articles(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(ArticleItemModel).filter(ArticleItemModel.userId == current_user.id).all()
    return [ArticleItem(id=r.id, title=r.title, content=r.content, contentZh=r.contentZh, type=r.type) for r in rows]


@app.post("/api/articles", response_model=ArticleItem)
def create_article(payload: ArticleCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(ArticleItemModel).filter(ArticleItemModel.userId == current_user.id).count()
    item = ArticleItemModel(id=f"a{count+1}", title=payload.title, content=payload.content, contentZh=payload.contentZh, type=payload.type, userId=current_user.id)
    db.add(item)
    db.commit()
    return ArticleItem(id=item.id, title=item.title, content=item.content, contentZh=item.contentZh, type=item.type)


# --- Stats Schemas ---

class StatItem(BaseModel):
    date: str
    newCount: int
    reviewCount: int
    dictationCount: int

class StatEvent(BaseModel):
    type: str


def today_str():
    return date.today().isoformat()


# --- Stats Endpoints ---

@app.get("/api/stats/today", response_model=StatItem)
def get_today(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    t = today_str()
    row = db.query(DailyStatModel).filter(DailyStatModel.date == t, DailyStatModel.userId == current_user.id).first()
    if not row:
        row = DailyStatModel(date=t, userId=current_user.id, newCount=0, reviewCount=0, dictationCount=0)
        db.add(row)
        db.commit()
    return StatItem(date=row.date, newCount=row.newCount, reviewCount=row.reviewCount, dictationCount=row.dictationCount)


@app.post("/api/stats/event", response_model=StatItem)
def add_event(ev: StatEvent, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    t = today_str()
    row = db.query(DailyStatModel).filter(DailyStatModel.date == t, DailyStatModel.userId == current_user.id).first()
    if not row:
        row = DailyStatModel(date=t, userId=current_user.id, newCount=0, reviewCount=0, dictationCount=0)
        db.add(row)
    if ev.type == "new":
        row.newCount += 1
    elif ev.type == "review":
        row.reviewCount += 1
    elif ev.type == "dictation":
        row.dictationCount += 1
    db.commit()
    return StatItem(date=row.date, newCount=row.newCount, reviewCount=row.reviewCount, dictationCount=row.dictationCount)

