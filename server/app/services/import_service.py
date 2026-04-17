import uuid
import threading
import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings as app_settings
from app.database import SessionLocal
from app.models.dict import DictModel
from app.models.dict_word import DictWordModel
from app.models.user_word_progress import UserWordProgressModel
from app.models.word import WordModel
from app.models.word_meaning import WordMeaningModel
from app.models.word_example import WordExampleModel
from app.models.article import ArticleItemModel
from app.models.stat import DailyStatModel
from app.models.settings import UserSettingsModel
from app.schemas.common import ExportData
from app.schemas.dict import DictItem
from app.schemas.word import WordItem
from app.schemas.article import ArticleItem
from app.schemas.stat import StatItem
from app.schemas.settings import UserSettings
from app.services.word_service import (
    word_item_from_models,
    get_or_create_word,
    _build_meaning_from_rows,
    _build_example_from_rows,
)
from app.services.dict_service import get_dict_or_404, add_word_to_dict
from app.services.learning_service import get_or_create_progress
from app.services.lookup_service import lookup_word

logger = logging.getLogger(__name__)

_import_tasks: dict[str, dict] = {}
_import_lock = threading.Lock()


def _word_item_from_word_model(
    db: Session, word: WordModel, user_id: str, dict_id: str = None
) -> WordItem:
    meaning_rows = (
        db.query(WordMeaningModel)
        .filter(WordMeaningModel.word_id == word.id)
        .order_by(WordMeaningModel.sort_order)
        .all()
    )

    example_rows = (
        db.query(WordExampleModel)
        .filter(WordExampleModel.word_id == word.id)
        .order_by(WordExampleModel.sort_order)
        .all()
    )

    progress = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.user_id == user_id,
            UserWordProgressModel.word_id == word.id,
        )
        .first()
    )

    return word_item_from_models(word, meaning_rows, example_rows, progress, dict_id)


def export_all_data(db: Session, user_id: str) -> ExportData:
    dict_rows = db.query(DictModel).filter(DictModel.user_id == user_id).all()

    dict_items = []
    for d in dict_rows:
        dict_items.append(
            DictItem(
                id=d.id,
                name=d.name,
                wordCount=d.word_count or 0,
                source=d.source or "custom",
            )
        )

    word_items = []
    user_progress_rows = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.user_id == user_id,
        )
        .all()
    )

    for progress in user_progress_rows:
        word = db.query(WordModel).filter(WordModel.id == progress.word_id).first()
        if not word:
            continue

        dict_word = (
            db.query(DictWordModel)
            .filter(
                DictWordModel.word_id == word.id,
            )
            .first()
        )
        dict_id = dict_word.dict_id if dict_word else None

        word_item = _word_item_from_word_model(db, word, user_id, dict_id)
        word_items.append(word_item)

    article_rows = (
        db.query(ArticleItemModel).filter(ArticleItemModel.userId == user_id).all()
    )
    stat_rows = db.query(DailyStatModel).filter(DailyStatModel.userId == user_id).all()
    user_settings = (
        db.query(UserSettingsModel).filter(UserSettingsModel.userId == user_id).first()
    )

    return ExportData(
        dicts=dict_items,
        words=word_items,
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
    for d in payload.dicts:
        existing = db.query(DictModel).filter(DictModel.id == d.id).first()
        if existing:
            existing.name = d.name
            existing.word_count = d.wordCount
            existing.source = d.source
        else:
            db.add(
                DictModel(
                    id=d.id,
                    name=d.name,
                    word_count=d.wordCount,
                    source=d.source,
                    user_id=user_id,
                )
            )

    for w in payload.words:
        word = get_or_create_word(db, w.term)
        if w.meaning:
            for line in w.meaning.split("\n"):
                line = line.strip()
                if not line:
                    continue
                existing_meaning = (
                    db.query(WordMeaningModel)
                    .filter(
                        WordMeaningModel.word_id == word.id,
                        WordMeaningModel.description == line,
                    )
                    .first()
                )
                if not existing_meaning:
                    db.add(
                        WordMeaningModel(
                            id=f"wm{uuid.uuid4().hex[:12]}",
                            word_id=word.id,
                            description=line,
                        )
                    )

        if w.example:
            for line in w.example.split("\n"):
                line = line.strip()
                if not line:
                    continue
                existing_ex = (
                    db.query(WordExampleModel)
                    .filter(
                        WordExampleModel.word_id == word.id,
                        WordExampleModel.sentence == line,
                    )
                    .first()
                )
                if not existing_ex:
                    db.add(
                        WordExampleModel(
                            id=f"we{uuid.uuid4().hex[:12]}",
                            word_id=word.id,
                            sentence=line,
                        )
                    )

        if w.dictId:
            add_word_to_dict(db, w.dictId, word.id)

        get_or_create_progress(db, user_id, word.id)

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

            existing_word = (
                db.query(WordModel)
                .filter(
                    WordModel.term == word_text,
                )
                .first()
            )

            if existing_word:
                existing_progress = (
                    db.query(UserWordProgressModel)
                    .filter(
                        UserWordProgressModel.user_id == user_id,
                        UserWordProgressModel.word_id == existing_word.id,
                    )
                    .first()
                )
                if existing_progress:
                    skipped_count += 1
                    continue

            result = lookup_word(word_text)
            if not result:
                failed_count += 1
                continue

            word = get_or_create_word(db, word_text, result)

            if dict_id:
                add_word_to_dict(db, dict_id, word.id)

            get_or_create_progress(db, user_id, word.id)

            imported_count += 1

            if imported_count % batch_size == 0:
                db.commit()

        db.commit()

        with _import_lock:
            _import_tasks[task_id]["status"] = "completed"
            _import_tasks[task_id]["imported"] = imported_count
            _import_tasks[task_id]["failed"] = failed_count
            _import_tasks[task_id]["skipped"] = skipped_count

    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        logger.exception(f"Import task {task_id} failed")
        with _import_lock:
            _import_tasks[task_id]["status"] = "failed"
            _import_tasks[task_id]["error"] = str(e)
    finally:
        try:
            db.close()
        except Exception:
            pass


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
    get_dict_or_404(db, dict_id, user_id)

    if len(words) > app_settings.MAX_QUICK_IMPORT_WORDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"快速导入最多支持 {app_settings.MAX_QUICK_IMPORT_WORDS} 个单词，更多请使用批量导入",
        )

    imported = 0
    skipped = 0
    for word_text in words:
        word_text = word_text.strip()
        if not word_text:
            continue

        word = get_or_create_word(db, word_text)

        existing_progress = (
            db.query(UserWordProgressModel)
            .filter(
                UserWordProgressModel.user_id == user_id,
                UserWordProgressModel.word_id == word.id,
            )
            .first()
        )
        if existing_progress:
            skipped += 1
            continue

        if dict_id:
            add_word_to_dict(db, dict_id, word.id)

        get_or_create_progress(db, user_id, word.id)
        imported += 1

    db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "total": len(words),
        "detail": f"成功导入 {imported} 个单词，跳过 {skipped} 个已存在单词",
    }
