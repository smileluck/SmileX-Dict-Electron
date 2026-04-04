import uuid
import json
import os
from datetime import date, datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from db import engine, SessionLocal, Base, get_db
from models import (
    UserModel,
    DictItemModel,
    WordItemModel,
    ArticleItemModel,
    DailyStatModel,
    UserSettingsModel,
)
from auth import hash_password, verify_password, create_access_token, get_current_user

app = FastAPI(title="SmileX Dict Admin")

ALLOWED_ORIGINS = json.loads(os.getenv("ALLOWED_ORIGINS", '["*"]'))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    error_messages = {
        400: "请求参数错误",
        401: "用户名或密码错误",
        403: "没有访问权限",
        404: "资源不存在",
        422: "数据格式错误",
        500: "服务器内部错误",
    }

    detail = exc.detail
    if isinstance(detail, str):
        translations = {
            "Username already registered": "用户名已被注册",
            "Incorrect username or password": "用户名或密码错误",
            "Could not validate credentials": "认证失败，请重新登录",
        }
        detail = translations.get(
            detail, error_messages.get(exc.status_code, str(detail))
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import traceback

    print(f"Unhandled exception: {str(exc)}")
    print(traceback.format_exc())

    return JSONResponse(
        status_code=500,
        content={"detail": "服务器错误，请稍后重试"},
    )


with engine.connect() as conn:
    result = conn.execute(text("PRAGMA table_info(daily_stats)"))
    columns = [row[1] for row in result]
    if "wrongCount" not in columns:
        conn.execute(
            text("ALTER TABLE daily_stats ADD COLUMN wrongCount INTEGER DEFAULT 0")
        )
        conn.commit()

    result = conn.execute(text("PRAGMA table_info(words)"))
    columns = [row[1] for row in result]
    if "enMeaning" not in columns:
        conn.execute(text("ALTER TABLE words ADD COLUMN enMeaning TEXT"))
        conn.commit()


# --- Auth Schemas ---


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=64)


class UserLogin(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=64)


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
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码需要至少8个字符",
        )
    if not any(c.isupper() for c in payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码需要包含大写字母",
        )
    if not any(c.islower() for c in payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码需要包含小写字母",
        )
    if not any(c.isdigit() for c in payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码需要包含数字",
        )
    if not any(c in "!@#" for c in payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码需要包含特殊字符(!@#)",
        )
    if any(not c.isalnum() and c not in "!@#" for c in payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码只能包含字母、数字和特殊字符(!@#)",
        )

    existing = (
        db.query(UserModel).filter(UserModel.username == payload.username).first()
    )
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


class DictUpdate(BaseModel):
    name: Optional[str] = None


# --- Dict Endpoints ---


@app.get("/api/dicts", response_model=List[DictItem])
def list_dicts(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    rows = db.query(DictItemModel).filter(DictItemModel.userId == current_user.id).all()
    return [
        DictItem(id=r.id, name=r.name, wordCount=r.wordCount, source=r.source)
        for r in rows
    ]


@app.post("/api/dicts", response_model=DictItem)
def create_dict(
    payload: DictCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(DictItemModel).filter(DictItemModel.userId == current_user.id).count()
    )
    item = DictItemModel(
        id=f"d{count + 1}",
        name=payload.name,
        wordCount=payload.wordCount,
        source="custom",
        userId=current_user.id,
    )
    db.add(item)
    db.commit()
    return DictItem(
        id=item.id, name=item.name, wordCount=item.wordCount, source=item.source
    )


@app.put("/api/dicts/{dict_id}", response_model=DictItem)
def update_dict(
    dict_id: str,
    payload: DictUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(DictItemModel)
        .filter(DictItemModel.id == dict_id, DictItemModel.userId == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    if payload.name is not None:
        item.name = payload.name
    db.commit()
    db.refresh(item)
    return DictItem(
        id=item.id, name=item.name, wordCount=item.wordCount, source=item.source
    )


@app.delete("/api/dicts/{dict_id}")
def delete_dict(
    dict_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(DictItemModel)
        .filter(DictItemModel.id == dict_id, DictItemModel.userId == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    db.query(WordItemModel).filter(
        WordItemModel.dictId == dict_id, WordItemModel.userId == current_user.id
    ).delete()
    db.delete(item)
    db.commit()
    return {"detail": "已删除"}


# --- Word Schemas ---


class WordItem(BaseModel):
    id: str
    term: str
    ipa: Optional[str] = None
    meaning: str
    enMeaning: Optional[str] = None
    example: Optional[str] = None
    synonyms: List[str] = []
    synonymsNote: Optional[str] = None
    status: str = Field(default="new")
    dictId: Optional[str] = None


class WordUpdate(BaseModel):
    term: Optional[str] = None
    ipa: Optional[str] = None
    meaning: Optional[str] = None
    enMeaning: Optional[str] = None
    example: Optional[str] = None
    synonyms: Optional[List[str]] = None
    synonymsNote: Optional[str] = None
    status: Optional[str] = None
    dictId: Optional[str] = None


def _word_item_from_model(r: WordItemModel) -> WordItem:
    syn = []
    if r.synonyms:
        try:
            syn = r.synonyms.split(",")
        except Exception:
            syn = []
    return WordItem(
        id=r.id,
        term=r.term,
        ipa=r.ipa,
        meaning=r.meaning,
        enMeaning=r.enMeaning,
        example=r.example,
        synonyms=syn,
        synonymsNote=r.synonymsNote,
        status=r.status,
        dictId=r.dictId,
    )


# --- Word Endpoints ---


@app.get("/api/words", response_model=List[WordItem])
def list_words(
    dictId: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(WordItemModel).filter(WordItemModel.userId == current_user.id)
    if dictId:
        q = q.filter(WordItemModel.dictId == dictId)
    rows = q.all()
    return [_word_item_from_model(r) for r in rows]


@app.post("/api/words", response_model=WordItem)
def create_word(
    word: WordItem,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    synonyms = ",".join(word.synonyms or [])
    item = WordItemModel(
        id=word.id,
        term=word.term,
        ipa=word.ipa,
        meaning=word.meaning,
        enMeaning=word.enMeaning,
        example=word.example,
        synonyms=synonyms,
        synonymsNote=word.synonymsNote,
        status=word.status,
        dictId=word.dictId,
        userId=current_user.id,
    )
    db.add(item)
    db.commit()
    return word


@app.put("/api/words/{word_id}", response_model=WordItem)
def update_word(
    word_id: str,
    payload: WordUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(WordItemModel)
        .filter(WordItemModel.id == word_id, WordItemModel.userId == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")
    if payload.term is not None:
        item.term = payload.term
    if payload.ipa is not None:
        item.ipa = payload.ipa
    if payload.meaning is not None:
        item.meaning = payload.meaning
    if payload.enMeaning is not None:
        item.enMeaning = payload.enMeaning
    if payload.example is not None:
        item.example = payload.example
    if payload.synonyms is not None:
        item.synonyms = ",".join(payload.synonyms)
    if payload.synonymsNote is not None:
        item.synonymsNote = payload.synonymsNote
    if payload.status is not None:
        item.status = payload.status
    if payload.dictId is not None:
        item.dictId = payload.dictId
    db.commit()
    db.refresh(item)
    return _word_item_from_model(item)


@app.delete("/api/words/{word_id}")
def delete_word(
    word_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(WordItemModel)
        .filter(WordItemModel.id == word_id, WordItemModel.userId == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")
    db.delete(item)
    db.commit()
    return {"detail": "已删除"}


@app.get("/api/words/search", response_model=List[WordItem])
def search_words(
    q: str = Query(..., min_length=1),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pattern = f"%{q}%"
    rows = (
        db.query(WordItemModel)
        .filter(
            WordItemModel.userId == current_user.id,
            or_(
                WordItemModel.term.ilike(pattern),
                WordItemModel.meaning.ilike(pattern),
            ),
        )
        .all()
    )
    return [_word_item_from_model(r) for r in rows]


@app.post("/api/words/bulk", response_model=List[WordItem])
def bulk_create_words(
    words: List[WordItem],
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = []
    for word in words:
        synonyms = ",".join(word.synonyms or [])
        item = WordItemModel(
            id=word.id,
            term=word.term,
            ipa=word.ipa,
            meaning=word.meaning,
            enMeaning=word.enMeaning,
            example=word.example,
            synonyms=synonyms,
            synonymsNote=word.synonymsNote,
            status=word.status,
            dictId=word.dictId,
            userId=current_user.id,
        )
        db.add(item)
        db.commit()
        result.append(word)
    return result


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
def list_articles(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    rows = (
        db.query(ArticleItemModel)
        .filter(ArticleItemModel.userId == current_user.id)
        .all()
    )
    return [
        ArticleItem(
            id=r.id,
            title=r.title,
            content=r.content,
            contentZh=r.contentZh,
            type=r.type,
        )
        for r in rows
    ]


@app.post("/api/articles", response_model=ArticleItem)
def create_article(
    payload: ArticleCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(ArticleItemModel)
        .filter(ArticleItemModel.userId == current_user.id)
        .count()
    )
    item = ArticleItemModel(
        id=f"a{count + 1}",
        title=payload.title,
        content=payload.content,
        contentZh=payload.contentZh,
        type=payload.type,
        userId=current_user.id,
    )
    db.add(item)
    db.commit()
    return ArticleItem(
        id=item.id,
        title=item.title,
        content=item.content,
        contentZh=item.contentZh,
        type=item.type,
    )


@app.delete("/api/articles/{article_id}")
def delete_article(
    article_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(ArticleItemModel)
        .filter(
            ArticleItemModel.id == article_id,
            ArticleItemModel.userId == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")
    db.delete(item)
    db.commit()
    return {"detail": "已删除"}


# --- Stats Schemas ---


class StatItem(BaseModel):
    date: str
    newCount: int
    reviewCount: int
    dictationCount: int
    wrongCount: int = 0


class StatEvent(BaseModel):
    type: str


def today_str():
    return date.today().isoformat()


def _get_or_create_stat(db: Session, d: str, user_id: str) -> DailyStatModel:
    row = (
        db.query(DailyStatModel)
        .filter(DailyStatModel.date == d, DailyStatModel.userId == user_id)
        .first()
    )
    if not row:
        row = DailyStatModel(
            date=d,
            userId=user_id,
            newCount=0,
            reviewCount=0,
            dictationCount=0,
            wrongCount=0,
        )
        db.add(row)
        db.commit()
    return row


# --- Stats Endpoints ---


@app.get("/api/stats/today", response_model=StatItem)
def get_today(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    t = today_str()
    row = _get_or_create_stat(db, t, current_user.id)
    return StatItem(
        date=row.date,
        newCount=row.newCount,
        reviewCount=row.reviewCount,
        dictationCount=row.dictationCount,
        wrongCount=row.wrongCount,
    )


@app.get("/api/stats/history", response_model=List[StatItem])
def get_history(
    days: int = Query(default=7, ge=1, le=365),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    start = today - timedelta(days=days - 1)
    rows = (
        db.query(DailyStatModel)
        .filter(
            DailyStatModel.date >= start.isoformat(),
            DailyStatModel.date <= today.isoformat(),
            DailyStatModel.userId == current_user.id,
        )
        .all()
    )
    row_map = {r.date: r for r in rows}
    result = []
    for i in range(days):
        d = (start + timedelta(days=i)).isoformat()
        if d in row_map:
            r = row_map[d]
            result.append(
                StatItem(
                    date=r.date,
                    newCount=r.newCount,
                    reviewCount=r.reviewCount,
                    dictationCount=r.dictationCount,
                    wrongCount=r.wrongCount,
                )
            )
        else:
            result.append(
                StatItem(
                    date=d, newCount=0, reviewCount=0, dictationCount=0, wrongCount=0
                )
            )
    return result


@app.post("/api/stats/event", response_model=StatItem)
def add_event(
    ev: StatEvent,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = today_str()
    row = _get_or_create_stat(db, t, current_user.id)
    if ev.type == "new":
        row.newCount += 1
    elif ev.type == "review":
        row.reviewCount += 1
    elif ev.type == "dictation":
        row.dictationCount += 1
    elif ev.type == "wrong":
        row.wrongCount += 1
    db.commit()
    return StatItem(
        date=row.date,
        newCount=row.newCount,
        reviewCount=row.reviewCount,
        dictationCount=row.dictationCount,
        wrongCount=row.wrongCount,
    )


# --- Settings Schemas ---


class UserSettings(BaseModel):
    userId: str
    username: str
    dailyNewWordTarget: int = 20


class UserSettingsUpdate(BaseModel):
    username: Optional[str] = None
    dailyNewWordTarget: Optional[int] = None


# --- Settings Endpoints ---


@app.get("/api/settings", response_model=UserSettings)
def get_settings(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    settings = (
        db.query(UserSettingsModel)
        .filter(UserSettingsModel.userId == current_user.id)
        .first()
    )
    if not settings:
        settings = UserSettingsModel(
            userId=current_user.id,
            username=current_user.username,
            dailyNewWordTarget=20,
        )
        db.add(settings)
        db.commit()
    return UserSettings(
        userId=settings.userId,
        username=settings.username,
        dailyNewWordTarget=settings.dailyNewWordTarget,
    )


@app.put("/api/settings", response_model=UserSettings)
def update_settings(
    payload: UserSettingsUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = (
        db.query(UserSettingsModel)
        .filter(UserSettingsModel.userId == current_user.id)
        .first()
    )
    if not settings:
        settings = UserSettingsModel(
            userId=current_user.id,
            username=current_user.username,
            dailyNewWordTarget=20,
        )
        db.add(settings)

    if payload.username is not None:
        settings.username = payload.username
    if payload.dailyNewWordTarget is not None:
        settings.dailyNewWordTarget = payload.dailyNewWordTarget

    settings.lastUpdateAt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(settings)
    return UserSettings(
        userId=settings.userId,
        username=settings.username,
        dailyNewWordTarget=settings.dailyNewWordTarget,
    )


# --- Health Check ---


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# --- Data Export/Import ---


class ExportData(BaseModel):
    dicts: List[DictItem]
    words: List[WordItem]
    articles: List[ArticleItem]
    stats: List[StatItem]
    settings: Optional[UserSettings] = None


@app.get("/api/export", response_model=ExportData)
def export_data(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    dict_rows = (
        db.query(DictItemModel).filter(DictItemModel.userId == current_user.id).all()
    )
    word_rows = (
        db.query(WordItemModel).filter(WordItemModel.userId == current_user.id).all()
    )
    article_rows = (
        db.query(ArticleItemModel)
        .filter(ArticleItemModel.userId == current_user.id)
        .all()
    )
    stat_rows = (
        db.query(DailyStatModel).filter(DailyStatModel.userId == current_user.id).all()
    )
    settings = (
        db.query(UserSettingsModel)
        .filter(UserSettingsModel.userId == current_user.id)
        .first()
    )

    return ExportData(
        dicts=[
            DictItem(id=r.id, name=r.name, wordCount=r.wordCount, source=r.source)
            for r in dict_rows
        ],
        words=[_word_item_from_model(r) for r in word_rows],
        articles=[
            ArticleItem(
                id=r.id,
                title=r.title,
                content=r.content,
                contentZh=r.contentZh,
                type=r.type,
            )
            for r in article_rows
        ],
        stats=[
            StatItem(
                date=r.date,
                newCount=r.newCount,
                reviewCount=r.reviewCount,
                dictationCount=r.dictationCount,
                wrongCount=r.wrongCount,
            )
            for r in stat_rows
        ],
        settings=(
            UserSettings(
                userId=settings.userId,
                username=settings.username,
                practiceMode=settings.practiceMode,
                dailyNewWordTarget=settings.dailyNewWordTarget,
            )
            if settings
            else None
        ),
    )


@app.post("/api/import")
def import_data(
    payload: ExportData,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for d in payload.dicts:
        existing = db.query(DictItemModel).filter(DictItemModel.id == d.id).first()
        if existing:
            existing.name = d.name
            existing.wordCount = d.wordCount
            existing.source = d.source
        else:
            db.add(
                DictItemModel(
                    id=d.id,
                    name=d.name,
                    wordCount=d.wordCount,
                    source=d.source,
                    userId=current_user.id,
                )
            )

    for w in payload.words:
        existing = db.query(WordItemModel).filter(WordItemModel.id == w.id).first()
        synonyms = ",".join(w.synonyms or [])
        if existing:
            existing.term = w.term
            existing.ipa = w.ipa
            existing.meaning = w.meaning
            existing.enMeaning = w.enMeaning
            existing.example = w.example
            existing.synonyms = synonyms
            existing.synonymsNote = w.synonymsNote
            existing.status = w.status
            existing.dictId = w.dictId
        else:
            db.add(
                WordItemModel(
                    id=w.id,
                    term=w.term,
                    ipa=w.ipa,
                    meaning=w.meaning,
                    enMeaning=w.enMeaning,
                    example=w.example,
                    synonyms=synonyms,
                    synonymsNote=w.synonymsNote,
                    status=w.status,
                    dictId=w.dictId,
                    userId=current_user.id,
                )
            )

    for a in payload.articles:
        existing = (
            db.query(ArticleItemModel).filter(ArticleItemModel.id == a.id).first()
        )
        if existing:
            existing.title = a.title
            existing.content = a.content
            existing.contentZh = a.contentZh
            existing.type = a.type
        else:
            db.add(
                ArticleItemModel(
                    id=a.id,
                    title=a.title,
                    content=a.content,
                    contentZh=a.contentZh,
                    type=a.type,
                    userId=current_user.id,
                )
            )

    for s in payload.stats:
        existing = (
            db.query(DailyStatModel)
            .filter(
                DailyStatModel.date == s.date,
                DailyStatModel.userId == current_user.id,
            )
            .first()
        )
        if existing:
            existing.newCount = s.newCount
            existing.reviewCount = s.reviewCount
            existing.dictationCount = s.dictationCount
            existing.wrongCount = s.wrongCount
        else:
            db.add(
                DailyStatModel(
                    date=s.date,
                    userId=current_user.id,
                    newCount=s.newCount,
                    reviewCount=s.reviewCount,
                    dictationCount=s.dictationCount,
                    wrongCount=s.wrongCount,
                )
            )

    if payload.settings:
        settings = (
            db.query(UserSettingsModel)
            .filter(UserSettingsModel.userId == current_user.id)
            .first()
        )
        if settings:
            settings.username = payload.settings.username
            settings.practiceMode = payload.settings.practiceMode
            settings.dailyNewWordTarget = payload.settings.dailyNewWordTarget
        else:
            db.add(
                UserSettingsModel(
                    userId=current_user.id,
                    username=payload.settings.username,
                    practiceMode=payload.settings.practiceMode,
                    dailyNewWordTarget=payload.settings.dailyNewWordTarget,
                )
            )

    db.commit()
    return {"detail": "导入成功"}
