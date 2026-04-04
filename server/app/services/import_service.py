import uuid
import threading
import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings as app_settings
from app.database import SessionLocal
from app.models.dict import DictItemModel
from app.models.word import WordItemModel
from app.schemas.common import ExportData
from app.schemas.dict import DictItem
from app.schemas.article import ArticleItem
from app.schemas.stat import StatItem
from app.schemas.settings import UserSettings
from app.services.word_service import word_item_from_model
from app.services.lookup_service import lookup_word

logger = logging.getLogger(__name__)

_import_tasks: dict[str, dict] = {}
_import_lock = threading.Lock()


def export_all_data(db: Session, user_id: str) -> ExportData:
    from app.models.article import ArticleItemModel
    from app.models.stat import DailyStatModel
    from app.models.settings import UserSettingsModel

    dict_rows = db.query(DictItemModel).filter(DictItemModel.userId == user_id).all()
    word_rows = db.query(WordItemModel).filter(WordItemModel.userId == user_id).all()
    article_rows = (
        db.query(ArticleItemModel).filter(ArticleItemModel.userId == user_id).all()
    )
    stat_rows = db.query(DailyStatModel).filter(DailyStatModel.userId == user_id).all()
    user_settings = (
        db.query(UserSettingsModel).filter(UserSettingsModel.userId == user_id).first()
    )

    return ExportData(
        dicts=[
            DictItem(id=r.id, name=r.name, wordCount=r.wordCount, source=r.source)
            for r in dict_rows
        ],
        words=[word_item_from_model(r) for r in word_rows],
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
        settings=UserSettings(
            userId=user_settings.userId,
            username=user_settings.username,
            dailyNewWordTarget=user_settings.dailyNewWordTarget,
        )
        if user_settings
        else None,
    )


def import_all_data(db: Session, user_id: str, payload: ExportData) -> None:
    from app.models.article import ArticleItemModel
    from app.models.stat import DailyStatModel
    from app.models.settings import UserSettingsModel

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
                    userId=user_id,
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
                    userId=user_id,
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
                    userId=user_id,
                )
            )

    for s in payload.stats:
        existing = (
            db.query(DailyStatModel)
            .filter(DailyStatModel.date == s.date, DailyStatModel.userId == user_id)
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
                    userId=user_id,
                    newCount=s.newCount,
                    reviewCount=s.reviewCount,
                    dictationCount=s.dictationCount,
                    wrongCount=s.wrongCount,
                )
            )

    if payload.settings:
        user_settings = (
            db.query(UserSettingsModel)
            .filter(UserSettingsModel.userId == user_id)
            .first()
        )
        if user_settings:
            user_settings.username = payload.settings.username
            user_settings.dailyNewWordTarget = payload.settings.dailyNewWordTarget
        else:
            db.add(
                UserSettingsModel(
                    userId=user_id,
                    username=payload.settings.username,
                    dailyNewWordTarget=payload.settings.dailyNewWordTarget,
                )
            )

    db.commit()


def _run_txt_import(task_id: str, words: list[str], dict_id: str, user_id: str):
    db = SessionLocal()
    try:
        imported_count = 0
        failed_count = 0
        skipped_count = 0
        total = len(words)
        batch_size = app_settings.TXT_IMPORT_BATCH_SIZE

        for i, word_text in enumerate(words):
            word_text = word_text.strip()
            if not word_text:
                continue

            with _import_lock:
                _import_tasks[task_id]["current"] = i + 1
                _import_tasks[task_id]["current_word"] = word_text

            existing = (
                db.query(WordItemModel)
                .filter(
                    WordItemModel.term == word_text, WordItemModel.userId == user_id
                )
                .first()
            )
            if existing:
                skipped_count += 1
                continue

            result = lookup_word(word_text)
            if not result:
                failed_count += 1
                continue

            word_id = f"w{uuid.uuid4().hex[:12]}"
            synonyms_str = ",".join(result.get("synonyms", []))
            new_word = WordItemModel(
                id=word_id,
                term=result["term"],
                ipa=result.get("ipa", ""),
                meaning=result.get("meaning", ""),
                enMeaning=result.get("en_meaning", ""),
                example="\n".join(result.get("examples", [])[:3]),
                synonyms=synonyms_str,
                status="new",
                dictId=dict_id,
                userId=user_id,
            )
            db.add(new_word)
            imported_count += 1

            if imported_count % batch_size == 0:
                db.commit()

        db.commit()

        if dict_id:
            actual_count = (
                db.query(WordItemModel)
                .filter(
                    WordItemModel.dictId == dict_id, WordItemModel.userId == user_id
                )
                .count()
            )
            dict_item = (
                db.query(DictItemModel)
                .filter(DictItemModel.id == dict_id, DictItemModel.userId == user_id)
                .first()
            )
            if dict_item:
                dict_item.wordCount = actual_count
                db.commit()

        with _import_lock:
            _import_tasks[task_id]["status"] = "completed"
            _import_tasks[task_id]["imported"] = imported_count
            _import_tasks[task_id]["failed"] = failed_count
            _import_tasks[task_id]["skipped"] = skipped_count

    except Exception as e:
        db.rollback()
        logger.exception(f"Import task {task_id} failed")
        with _import_lock:
            _import_tasks[task_id]["status"] = "failed"
            _import_tasks[task_id]["error"] = str(e)
    finally:
        db.close()


def start_txt_import(db: Session, words: list[str], dict_id: str, user_id: str) -> dict:
    if len(words) > app_settings.MAX_BULK_IMPORT_WORDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"单次导入不能超过 {app_settings.MAX_BULK_IMPORT_WORDS} 个单词",
        )

    task_id = f"import-{uuid.uuid4().hex[:8]}"
    with _import_lock:
        _import_tasks[task_id] = {
            "id": task_id,
            "status": "running",
            "total": len(words),
            "current": 0,
            "current_word": "",
            "imported": 0,
            "failed": 0,
            "skipped": 0,
            "error": None,
            "dict_id": dict_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }

    thread = threading.Thread(
        target=_run_txt_import, args=(task_id, words, dict_id, user_id), daemon=True
    )
    thread.start()
    return {
        "task_id": task_id,
        "total": len(words),
        "detail": f"已开始导入 {len(words)} 个单词",
    }


def get_import_status(task_id: str) -> dict:
    with _import_lock:
        task = _import_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    return task


def quick_import_txt(db: Session, words: list[str], dict_id: str, user_id: str) -> dict:
    from app.services.dict_service import get_dict_or_404

    get_dict_or_404(db, dict_id, user_id)

    if len(words) > app_settings.MAX_QUICK_IMPORT_WORDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"快速导入最多支持 {app_settings.MAX_QUICK_IMPORT_WORDS} 个单词，更多请使用批量导入",
        )

    imported = 0
    skipped = 0
    for word_text in words:
        existing = (
            db.query(WordItemModel)
            .filter(WordItemModel.term == word_text, WordItemModel.userId == user_id)
            .first()
        )
        if existing:
            skipped += 1
            continue
        word_id = f"w{uuid.uuid4().hex[:12]}"
        new_word = WordItemModel(
            id=word_id,
            term=word_text,
            meaning=word_text,
            status="new",
            dictId=dict_id,
            userId=user_id,
        )
        db.add(new_word)
        imported += 1

    db.commit()

    actual_count = (
        db.query(WordItemModel)
        .filter(WordItemModel.dictId == dict_id, WordItemModel.userId == user_id)
        .count()
    )
    dict_item = (
        db.query(DictItemModel)
        .filter(DictItemModel.id == dict_id, DictItemModel.userId == user_id)
        .first()
    )
    if dict_item:
        dict_item.wordCount = actual_count
        db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "total": len(words),
        "detail": f"成功导入 {imported} 个单词，跳过 {skipped} 个已存在单词",
    }
