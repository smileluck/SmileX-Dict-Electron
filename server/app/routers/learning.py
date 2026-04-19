from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_current_user, get_db
from app.models.user import UserModel
from app.schemas.learning import (
    LearningProgress,
    LearningProgressUpdate,
    ReviewWordRequest,
)
from app.services import learning_service

router = APIRouter()


@router.get("/progress", response_model=list[LearningProgress])
def get_all_progress(
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.user_word_progress import UserWordProgressModel

    rows = (
        db.query(UserWordProgressModel)
        .filter(UserWordProgressModel.user_id == user.id)
        .all()
    )
    return [learning_service._progress_from_model(r) for r in rows]


@router.get("/progress/{word_id}", response_model=LearningProgress)
def get_word_progress(
    word_id: str,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = learning_service.get_or_create_progress(db, user.id, word_id)
    return learning_service._progress_from_model(progress)


@router.post("/sync", response_model=list[LearningProgress])
def sync_progress(
    items: list[LearningProgressUpdate],
    word_ids: Optional[list[str]] = None,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = []
    for item in items:
        word_id = item.word_id if hasattr(item, "word_id") else None
        if not word_id:
            continue
        progress = learning_service.update_progress(
            db,
            user.id,
            word_id,
            **item.model_dump(exclude={"word_id"}, exclude_none=True),
        )
        results.append(progress)
    return results


@router.post("/review/{word_id}", response_model=LearningProgress)
def review_word(
    word_id: str,
    body: ReviewWordRequest,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return learning_service.apply_sm2_review(
        db,
        user.id,
        word_id,
        quality=body.quality,
        response_time=body.response_time,
        learning_context=body.learning_context or "recall",
    )


@router.post("/batch-update", response_model=list[LearningProgress])
def batch_update_progress(
    items: list[dict],
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = []
    for item in items:
        word_id = item.get("word_id")
        if not word_id:
            continue
        updates = {k: v for k, v in item.items() if k != "word_id" and v is not None}
        progress = learning_service.update_progress(db, user.id, word_id, **updates)
        results.append(progress)
    return results
