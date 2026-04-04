from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.settings import UserSettingsModel
from app.schemas.settings import UserSettings, UserSettingsUpdate


def get_settings(db: Session, user_id: str, username: str) -> UserSettings:
    settings = (
        db.query(UserSettingsModel).filter(UserSettingsModel.userId == user_id).first()
    )
    if not settings:
        settings = UserSettingsModel(
            userId=user_id, username=username, dailyNewWordTarget=20
        )
        db.add(settings)
        db.commit()
    return UserSettings(
        userId=settings.userId,
        username=settings.username,
        dailyNewWordTarget=settings.dailyNewWordTarget,
    )


def update_settings(
    db: Session, user_id: str, username: str, payload: UserSettingsUpdate
) -> UserSettings:
    settings = (
        db.query(UserSettingsModel).filter(UserSettingsModel.userId == user_id).first()
    )
    if not settings:
        settings = UserSettingsModel(
            userId=user_id, username=username, dailyNewWordTarget=20
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
