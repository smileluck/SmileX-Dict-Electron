from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserModel
from app.schemas.stat import StatEvent, StatItem
from app.services import stat_service

router = APIRouter()


@router.get("/today", response_model=StatItem)
def get_today(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    return stat_service.get_today_stat(db, current_user.id)


@router.get("/history", response_model=List[StatItem])
def get_history(
    days: int = Query(default=7, ge=1, le=365),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return stat_service.get_history_stats(db, current_user.id, days)


@router.post("/event", response_model=StatItem)
def add_event(
    ev: StatEvent,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return stat_service.add_event(db, current_user.id, ev.type)
