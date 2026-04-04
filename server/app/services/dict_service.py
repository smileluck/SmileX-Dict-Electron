from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.dict import DictItemModel
from app.models.word import WordItemModel
from app.schemas.dict import DictCreate, DictItem, DictUpdate


def list_dicts(db: Session, user_id: str) -> list[DictItem]:
    rows = db.query(DictItemModel).filter(DictItemModel.userId == user_id).all()
    return [
        DictItem(id=r.id, name=r.name, wordCount=r.wordCount, source=r.source)
        for r in rows
    ]


def create_dict(db: Session, payload: DictCreate, user_id: str) -> DictItem:
    count = db.query(DictItemModel).filter(DictItemModel.userId == user_id).count()
    item = DictItemModel(
        id=f"d{count + 1}",
        name=payload.name,
        wordCount=payload.wordCount,
        source="custom",
        userId=user_id,
    )
    db.add(item)
    db.commit()
    return DictItem(
        id=item.id, name=item.name, wordCount=item.wordCount, source=item.source
    )


def update_dict(
    db: Session, dict_id: str, payload: DictUpdate, user_id: str
) -> DictItem:
    item = (
        db.query(DictItemModel)
        .filter(DictItemModel.id == dict_id, DictItemModel.userId == user_id)
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


def delete_dict(db: Session, dict_id: str, user_id: str) -> None:
    item = (
        db.query(DictItemModel)
        .filter(DictItemModel.id == dict_id, DictItemModel.userId == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    db.query(WordItemModel).filter(
        WordItemModel.dictId == dict_id, WordItemModel.userId == user_id
    ).delete()
    db.delete(item)
    db.commit()


def get_dict_or_404(db: Session, dict_id: str, user_id: str) -> DictItemModel:
    item = (
        db.query(DictItemModel)
        .filter(DictItemModel.id == dict_id, DictItemModel.userId == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    return item
