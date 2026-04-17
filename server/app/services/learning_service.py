import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.user_word_progress import UserWordProgressModel
from app.models.word import WordModel
from app.schemas.learning import LearningProgress


def _progress_from_model(p: UserWordProgressModel) -> LearningProgress:
    return LearningProgress(
        id=p.id,
        user_id=p.user_id,
        word_id=p.word_id,
        status=p.status or "new",
        efactor=p.efactor or 2.5,
        interval=p.interval or 0,
        next_review_date=p.next_review_date,
        last_review_date=p.last_review_date,
        repetitions=p.repetitions or 0,
        difficulty=p.difficulty or 3,
        importance=p.importance or 2,
        category=p.category or "general",
        learning_streak=p.learning_streak or 0,
        average_quality=p.average_quality or 0.0,
        last_response_quality=p.last_response_quality or 0.0,
        fatigue_factor=p.fatigue_factor or 1.0,
        response_time=p.response_time or 0,
        contextual_reviews=p.contextual_reviews or 0,
    )


def get_or_create_progress(
    db: Session, user_id: str, word_id: str
) -> UserWordProgressModel:
    progress = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.user_id == user_id,
            UserWordProgressModel.word_id == word_id,
        )
        .first()
    )
    if not progress:
        now = datetime.now(timezone.utc).isoformat()
        progress = UserWordProgressModel(
            id=f"up{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            word_id=word_id,
            status="new",
            next_review_date=now,
        )
        db.add(progress)
        db.flush()
    return progress


def update_progress(
    db: Session, user_id: str, word_id: str, **kwargs
) -> LearningProgress:
    progress = get_or_create_progress(db, user_id, word_id)
    for key, value in kwargs.items():
        if value is not None and hasattr(progress, key):
            setattr(progress, key, value)
    db.flush()
    return _progress_from_model(progress)


def apply_sm2_review(
    db: Session,
    user_id: str,
    word_id: str,
    quality: float,
    response_time: int = None,
    learning_context: str = "recall",
) -> LearningProgress:
    progress = get_or_create_progress(db, user_id, word_id)
    now = datetime.now(timezone.utc).isoformat()

    progress.last_review_date = now
    progress.last_response_quality = quality

    if response_time:
        total_time = progress.response_time or 0
        total_reviews = (progress.repetitions or 0) + 1
        progress.response_time = round(
            (total_time * (total_reviews - 1) + response_time) / total_reviews
        )

    if learning_context == "context":
        progress.contextual_reviews = (progress.contextual_reviews or 0) + 1

    total_reviews = (progress.repetitions or 0) + 1
    avg_q = progress.average_quality or 0.0
    progress.average_quality = round(
        (avg_q * (total_reviews - 1) + quality) / total_reviews, 2
    )

    if progress.response_time and progress.response_time > 10000:
        progress.fatigue_factor = min(1.0, (progress.fatigue_factor or 1.0) + 0.1)
    elif progress.response_time and progress.response_time < 3000:
        progress.fatigue_factor = max(0.1, (progress.fatigue_factor or 1.0) - 0.05)

    if quality < 3:
        progress.repetitions = max(0, (progress.repetitions or 0) - 1)
        progress.interval = 0
        if quality < 2:
            progress.status = "wrong"
        importance = progress.importance or 2
        penalty = 0.15 if importance == 3 else 0.1 if importance == 2 else 0.05
        progress.efactor = max(1.3, (progress.efactor or 2.5) - penalty)
        progress.fatigue_factor = min(1.0, (progress.fatigue_factor or 1.0) + 0.15)
    else:
        quality_multiplier = 0.15 if quality >= 6 else 0.1 if quality == 5 else 0.05

        context_multiplier = (
            1.1
            if learning_context == "context"
            else 1.05
            if learning_context == "typing"
            else 1.0
        )

        efactor_max = 2.2 if (progress.difficulty or 3) >= 4 else 2.5
        new_efactor = (progress.efactor or 2.5) + (
            quality_multiplier - (6 - quality) * (0.08 + (6 - quality) * 0.02)
        )
        progress.efactor = max(1.3, min(efactor_max, new_efactor * context_multiplier))

        progress.repetitions = (progress.repetitions or 0) + 1

        reps = progress.repetitions
        if reps == 1:
            base_interval = 1
        elif reps == 2:
            base_interval = 6
        elif reps == 3:
            base_interval = round(6 * progress.efactor)
        else:
            base_interval = round((progress.interval or 0) * progress.efactor)

        ff = progress.fatigue_factor or 1.0
        fatigue_adj = 1.2 if ff < 0.5 else 0.8 if ff > 0.8 else 1.0
        progress.interval = round(base_interval * fatigue_adj)

        if (progress.importance or 2) == 3:
            progress.interval = round(progress.interval * 1.1)

        if progress.repetitions >= 5:
            progress.status = "mastered"
        else:
            progress.status = "new"

        progress.fatigue_factor = max(0.1, (progress.fatigue_factor or 1.0) - 0.05)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    last = progress.last_review_date[:10] if progress.last_review_date else None
    if last == today:
        progress.learning_streak = (progress.learning_streak or 0) + 1
    else:
        progress.learning_streak = 1

    next_date = datetime.now(timezone.utc)
    next_date = next_date.replace(day=next_date.day + (progress.interval or 0))
    progress.next_review_date = next_date.isoformat()

    db.flush()
    return _progress_from_model(progress)


def get_user_progress_for_words(
    db: Session, user_id: str, word_ids: list[str]
) -> dict[str, UserWordProgressModel]:
    if not word_ids:
        return {}
    rows = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.user_id == user_id,
            UserWordProgressModel.word_id.in_(word_ids),
        )
        .all()
    )
    return {r.word_id: r for r in rows}


def get_status_counts(db: Session, user_id: str) -> dict:
    from sqlalchemy import func

    rows = (
        db.query(
            UserWordProgressModel.status,
            func.count(UserWordProgressModel.id),
        )
        .filter(
            UserWordProgressModel.user_id == user_id,
        )
        .group_by(UserWordProgressModel.status)
        .all()
    )
    counts = {"new": 0, "wrong": 0, "mastered": 0, "collected": 0}
    for status_val, count in rows:
        if status_val in counts:
            counts[status_val] = count
    return counts
