import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.dict import DictItemModel
from app.models.user import UserModel
from app.models.word import WordItemModel
from app.schemas.word import WordItem, WordLookupResult, WordUpdate
from app.services import import_service
from app.services.lookup_service import lookup_word
from app.services.word_service import word_item_from_model, word_model_from_schema

router = APIRouter()


@router.get("/search", response_model=List[WordItem])
def search_words(
    q: str = Query(..., min_length=1),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pattern = f"%{q}%"
    rows = (
        db.query(WordItemModel)
        .filter(
            WordItemModel.userId == current_user.id,
            or_(
                WordItemModel.term.ilike(pattern),
                WordItemModel.meaning.ilike(pattern),
            ),
        )
        .limit(100)
        .all()
    )
    return [word_item_from_model(r) for r in rows]


@router.get("/lookup", response_model=WordLookupResult)
def lookup_word_api(
    q: str = Query(..., min_length=1, max_length=100),
    save: bool = Query(default=False),
    dictId: Optional[str] = Query(default=None),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = lookup_word(q.strip())
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"未找到单词 '{q}' 的释义"
        )

    if save:
        existing = (
            db.query(WordItemModel)
            .filter(
                WordItemModel.term == result["term"],
                WordItemModel.userId == current_user.id,
            )
            .first()
        )
        if not existing:
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
                dictId=dictId,
                userId=current_user.id,
            )
            db.add(new_word)
            if dictId:
                dict_item = (
                    db.query(DictItemModel)
                    .filter(
                        DictItemModel.id == dictId,
                        DictItemModel.userId == current_user.id,
                    )
                    .first()
                )
                if dict_item:
                    dict_item.wordCount = (dict_item.wordCount or 0) + 1
            db.commit()

    return WordLookupResult(
        term=result["term"],
        ipa=result.get("ipa"),
        phonetic_uk=result.get("phonetic_uk"),
        phonetic_us=result.get("phonetic_us"),
        meaning=result.get("meaning", ""),
        en_meaning=result.get("en_meaning"),
        examples=result.get("examples", []),
        phrases=result.get("phrases", []),
        synonyms=result.get("synonyms", []),
        grammar=result.get("grammar", []),
    )


@router.get("", response_model=List[WordItem])
def list_words(
    dictId: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(WordItemModel).filter(WordItemModel.userId == current_user.id)
    if dictId:
        q = q.filter(WordItemModel.dictId == dictId)
    rows = q.all()
    return [word_item_from_model(r) for r in rows]


@router.post("", response_model=WordItem)
def create_word(
    word: WordItem,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = word_model_from_schema(word, current_user.id)
    db.add(item)
    db.commit()
    return word


@router.post("/bulk", response_model=List[WordItem])
def bulk_create_words(
    words: List[WordItem],
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = [word_model_from_schema(w, current_user.id) for w in words]
    db.add_all(items)
    db.commit()
    return words


@router.put("/{word_id}", response_model=WordItem)
def update_word(
    word_id: str,
    payload: WordUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(WordItemModel)
        .filter(WordItemModel.id == word_id, WordItemModel.userId == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")
    update_data = payload.model_dump(exclude_unset=True)
    if "synonyms" in update_data and update_data["synonyms"] is not None:
        update_data["synonyms"] = ",".join(update_data["synonyms"])
    for field, value in update_data.items():
        if value is not None:
            setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return word_item_from_model(item)


@router.delete("/{word_id}")
def delete_word(
    word_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(WordItemModel)
        .filter(WordItemModel.id == word_id, WordItemModel.userId == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")
    db.delete(item)
    db.commit()
    return {"detail": "已删除"}
