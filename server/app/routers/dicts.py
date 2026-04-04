from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserModel
from app.schemas.dict import DictCreate, DictItem, DictUpdate
from app.services import dict_service

router = APIRouter()


@router.get("", response_model=List[DictItem])
def list_dicts(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    return dict_service.list_dicts(db, current_user.id)


@router.post("", response_model=DictItem)
def create_dict(
    payload: DictCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dict_service.create_dict(db, payload, current_user.id)


@router.put("/{dict_id}", response_model=DictItem)
def update_dict(
    dict_id: str,
    payload: DictUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dict_service.update_dict(db, dict_id, payload, current_user.id)


@router.delete("/{dict_id}")
def delete_dict(
    dict_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dict_service.delete_dict(db, dict_id, current_user.id)
    return {"detail": "已删除"}
