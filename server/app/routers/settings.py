from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserModel
from app.schemas.settings import UserSettings, UserSettingsUpdate
from app.services import settings_service

router = APIRouter()


@router.get("", response_model=UserSettings)
def get_settings(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    return settings_service.get_settings(db, current_user.id, current_user.username)


@router.put("", response_model=UserSettings)
def update_settings(
    payload: UserSettingsUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return settings_service.update_settings(
        db, current_user.id, current_user.username, payload
    )
