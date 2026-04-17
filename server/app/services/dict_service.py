import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.dict import DictModel
from app.models.dict_word import DictWordModel
from app.models.word import WordModel
from app.schemas.dict import DictCreate, DictItem, DictUpdate


def _dict_item_from_model(d: DictModel) -> DictItem:
    return DictItem(
        id=d.id,
        name=d.name,
        wordCount=d.word_count or 0,
        source=d.source or "custom",
        isOfficial=bool(d.is_official),
        description=d.description,
    )


def list_dicts(db: Session, user_id: str) -> list[DictItem]:
    rows = db.query(DictModel).filter(DictModel.user_id == user_id).all()
    return [_dict_item_from_model(r) for r in rows]


def list_official_dicts(db: Session) -> list[DictItem]:
    rows = db.query(DictModel).filter(DictModel.is_official == 1).all()
    return [_dict_item_from_model(r) for r in rows]


def list_all_dicts(db: Session, user_id: str) -> list[DictItem]:
    user_dicts = db.query(DictModel).filter(DictModel.user_id == user_id).all()
    official_dicts = db.query(DictModel).filter(DictModel.is_official == 1).all()
    all_dicts = list(official_dicts) + [d for d in user_dicts if not d.is_official]
    return [_dict_item_from_model(r) for r in all_dicts]


def create_dict(db: Session, payload: DictCreate, user_id: str) -> DictItem:
    item = DictModel(
        id=f"d{uuid.uuid4().hex[:12]}",
        name=payload.name,
        word_count=payload.wordCount,
        source="custom",
        is_official=0,
        user_id=user_id,
    )
    db.add(item)
    db.commit()
    return _dict_item_from_model(item)


def update_dict(
    db: Session, dict_id: str, payload: DictUpdate, user_id: str
) -> DictItem:
    item = (
        db.query(DictModel)
        .filter(DictModel.id == dict_id, DictModel.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    if payload.name is not None:
        item.name = payload.name
    if payload.description is not None:
        item.description = payload.description
    db.commit()
    db.refresh(item)
    return _dict_item_from_model(item)


def delete_dict(db: Session, dict_id: str, user_id: str) -> None:
    item = (
        db.query(DictModel)
        .filter(DictModel.id == dict_id, DictModel.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    db.query(DictWordModel).filter(DictWordModel.dict_id == dict_id).delete()
    db.delete(item)
    db.commit()


def get_dict_or_404(db: Session, dict_id: str, user_id: str = None) -> DictModel:
    q = db.query(DictModel).filter(DictModel.id == dict_id)
    if user_id:
        q = q.filter((DictModel.user_id == user_id) | (DictModel.is_official == 1))
    item = q.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="词典不存在")
    return item


def add_word_to_dict(db: Session, dict_id: str, word_id: str) -> None:
    existing = (
        db.query(DictWordModel)
        .filter(
            DictWordModel.dict_id == dict_id,
            DictWordModel.word_id == word_id,
        )
        .first()
    )
    if existing:
        return
    dw_id = f"dw{uuid.uuid4().hex[:12]}"
    db.add(DictWordModel(id=dw_id, dict_id=dict_id, word_id=word_id))
    db.flush()

    count = db.query(DictWordModel).filter(DictWordModel.dict_id == dict_id).count()
    dict_item = db.query(DictModel).filter(DictModel.id == dict_id).first()
    if dict_item:
        dict_item.word_count = count
    db.flush()


def remove_word_from_dict(db: Session, dict_id: str, word_id: str) -> None:
    link = (
        db.query(DictWordModel)
        .filter(
            DictWordModel.dict_id == dict_id,
            DictWordModel.word_id == word_id,
        )
        .first()
    )
    if link:
        db.delete(link)
        db.flush()

    count = db.query(DictWordModel).filter(DictWordModel.dict_id == dict_id).count()
    dict_item = db.query(DictModel).filter(DictModel.id == dict_id).first()
    if dict_item:
        dict_item.word_count = count
    db.flush()


def get_word_ids_for_dict(db: Session, dict_id: str) -> list[str]:
    rows = (
        db.query(DictWordModel.word_id).filter(DictWordModel.dict_id == dict_id).all()
    )
    return [r[0] for r in rows]
