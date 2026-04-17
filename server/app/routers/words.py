from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.dict_word import DictWordModel
from app.models.user import UserModel
from app.models.user_word_progress import UserWordProgressModel
from app.models.word import WordModel
from app.models.word_meaning import WordMeaningModel
from app.models.word_example import WordExampleModel
from app.schemas.word import WordItem, WordLookupResult, WordUpdate
from app.schemas.learning import ReviewWordRequest
from app.services.word_service import word_item_from_models, get_or_create_word
from app.services.dict_service import add_word_to_dict, get_dict_or_404
from app.services.learning_service import (
    get_or_create_progress,
    apply_sm2_review,
    get_user_progress_for_words,
)
from app.services.lookup_service import lookup_word

router = APIRouter()


def _build_word_items_for_user(
    db: Session, words: list[WordModel], user_id: str
) -> list[WordItem]:
    if not words:
        return []

    word_ids = [w.id for w in words]

    meaning_rows = (
        db.query(WordMeaningModel)
        .filter(WordMeaningModel.word_id.in_(word_ids))
        .order_by(WordMeaningModel.sort_order)
        .all()
    )
    meanings_by_word: dict[str, list] = {}
    for m in meaning_rows:
        meanings_by_word.setdefault(m.word_id, []).append(m)

    example_rows = (
        db.query(WordExampleModel)
        .filter(WordExampleModel.word_id.in_(word_ids))
        .order_by(WordExampleModel.sort_order)
        .all()
    )
    examples_by_word: dict[str, list] = {}
    for e in example_rows:
        examples_by_word.setdefault(e.word_id, []).append(e)

    progress_map = get_user_progress_for_words(db, user_id, word_ids)

    dw_rows = db.query(DictWordModel).filter(DictWordModel.word_id.in_(word_ids)).all()
    dict_by_word: dict[str, str] = {}
    for dw in dw_rows:
        dict_by_word.setdefault(dw.word_id, dw.dict_id)

    result = []
    for w in words:
        item = word_item_from_models(
            word=w,
            meaning_rows=meanings_by_word.get(w.id, []),
            example_rows=examples_by_word.get(w.id, []),
            progress=progress_map.get(w.id),
            dict_id=dict_by_word.get(w.id),
        )
        result.append(item)
    return result


@router.get("/search", response_model=List[WordItem])
def search_words(
    q: str = Query(..., min_length=1),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pattern = f"%{q}%"

    user_word_ids = [
        r[0]
        for r in db.query(UserWordProgressModel.word_id)
        .filter(UserWordProgressModel.user_id == current_user.id)
        .all()
    ]
    if not user_word_ids:
        return []

    by_term = (
        db.query(WordModel.id)
        .filter(WordModel.id.in_(user_word_ids), WordModel.term.ilike(pattern))
        .all()
    )
    term_ids = {r[0] for r in by_term}

    by_meaning = (
        db.query(WordMeaningModel.word_id)
        .filter(
            WordMeaningModel.word_id.in_(user_word_ids),
            or_(
                WordMeaningModel.description.ilike(pattern),
                WordMeaningModel.description_en.ilike(pattern),
            ),
        )
        .distinct()
        .all()
    )
    meaning_ids = {r[0] for r in by_meaning}

    matched_ids = list(term_ids | meaning_ids)
    if not matched_ids:
        return []

    matched_ids = matched_ids[:100]
    words = db.query(WordModel).filter(WordModel.id.in_(matched_ids)).all()
    return _build_word_items_for_user(db, words, current_user.id)


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
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到单词 '{q}' 的释义",
        )

    if save:
        word = get_or_create_word(db, result["term"], result)
        get_or_create_progress(db, current_user.id, word.id)
        if dictId:
            get_dict_or_404(db, dictId, current_user.id)
            add_word_to_dict(db, dictId, word.id)
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
    if dictId:
        get_dict_or_404(db, dictId, current_user.id)
        word_ids = [
            r[0]
            for r in db.query(DictWordModel.word_id)
            .filter(DictWordModel.dict_id == dictId)
            .all()
        ]
    else:
        word_ids = [
            r[0]
            for r in db.query(UserWordProgressModel.word_id)
            .filter(UserWordProgressModel.user_id == current_user.id)
            .all()
        ]

    if not word_ids:
        return []

    words = db.query(WordModel).filter(WordModel.id.in_(word_ids)).all()
    return _build_word_items_for_user(db, words, current_user.id)


@router.post("", response_model=WordItem)
def create_word(
    word_data: WordItem,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lookup_data = {
        "ipa": word_data.ipa or "",
        "phonetic_uk": word_data.phonetic_uk or "",
        "phonetic_us": word_data.phonetic_us or "",
        "meaning": word_data.meaning or "",
        "en_meaning": word_data.enMeaning or "",
        "examples": (word_data.example or "").split("\n") if word_data.example else [],
        "synonyms": word_data.synonyms or [],
    }

    word = get_or_create_word(db, word_data.term, lookup_data)
    get_or_create_progress(db, current_user.id, word.id)

    if word_data.dictId:
        get_dict_or_404(db, word_data.dictId, current_user.id)
        add_word_to_dict(db, word_data.dictId, word.id)

    if word_data.status and word_data.status != "new":
        progress = get_or_create_progress(db, current_user.id, word.id)
        progress.status = word_data.status

    db.commit()
    db.refresh(word)
    items = _build_word_items_for_user(db, [word], current_user.id)
    return items[0]


@router.post("/bulk", response_model=List[WordItem])
def bulk_create_words(
    words: List[WordItem],
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    created_words = []
    for w in words:
        lookup_data = {
            "ipa": w.ipa or "",
            "phonetic_uk": w.phonetic_uk or "",
            "phonetic_us": w.phonetic_us or "",
            "meaning": w.meaning or "",
            "en_meaning": w.enMeaning or "",
            "examples": (w.example or "").split("\n") if w.example else [],
            "synonyms": w.synonyms or [],
        }
        word = get_or_create_word(db, w.term, lookup_data)
        get_or_create_progress(db, current_user.id, word.id)

        if w.dictId:
            get_dict_or_404(db, w.dictId, current_user.id)
            add_word_to_dict(db, w.dictId, word.id)

        if w.status and w.status != "new":
            progress = get_or_create_progress(db, current_user.id, word.id)
            progress.status = w.status

        created_words.append(word)

    db.commit()
    return _build_word_items_for_user(db, created_words, current_user.id)


@router.put("/{word_id}", response_model=WordItem)
def update_word(
    word_id: str,
    payload: WordUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(WordModel).filter(WordModel.id == word_id).first()
    if not word:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")

    progress = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.word_id == word_id,
            UserWordProgressModel.user_id == current_user.id,
        )
        .first()
    )
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")

    if payload.status is not None:
        progress.status = payload.status

    if payload.dictId is not None:
        old_links = (
            db.query(DictWordModel).filter(DictWordModel.word_id == word_id).all()
        )
        for link in old_links:
            db.delete(link)
        if payload.dictId:
            get_dict_or_404(db, payload.dictId, current_user.id)
            add_word_to_dict(db, payload.dictId, word_id)

    if payload.ipa is not None:
        word.ipa = payload.ipa
    if payload.phonetic_uk is not None:
        word.phonetic_uk = payload.phonetic_uk
    if payload.phonetic_us is not None:
        word.phonetic_us = payload.phonetic_us

    if payload.meaning is not None:
        db.query(WordMeaningModel).filter(WordMeaningModel.word_id == word_id).delete()
        for idx, line in enumerate(payload.meaning.split("\n")):
            line = line.strip()
            if not line:
                continue
            properties = ""
            description = line
            try:
                dot_idx = line.index(".")
                properties = line[: dot_idx + 1].strip()
                description = line[dot_idx + 1 :].strip()
            except ValueError:
                pass
            from uuid import uuid4

            db.add(
                WordMeaningModel(
                    id=f"wm{uuid4().hex[:12]}",
                    word_id=word_id,
                    properties=properties,
                    description=description,
                    description_en=payload.enMeaning or "",
                    synonym_words=",".join(payload.synonyms)
                    if payload.synonyms
                    else "",
                    sort_order=idx,
                )
            )

    elif payload.enMeaning is not None or payload.synonyms is not None:
        existing_meanings = (
            db.query(WordMeaningModel).filter(WordMeaningModel.word_id == word_id).all()
        )
        for m in existing_meanings:
            if payload.enMeaning is not None:
                m.description_en = payload.enMeaning
            if payload.synonyms is not None:
                m.synonym_words = ",".join(payload.synonyms)

    if payload.example is not None:
        db.query(WordExampleModel).filter(WordExampleModel.word_id == word_id).delete()
        for idx, line in enumerate(payload.example.split("\n")):
            line = line.strip()
            if not line:
                continue
            parts = line.split("\n", 1)
            sentence = parts[0].strip()
            translation = parts[1].strip() if len(parts) > 1 else ""
            from uuid import uuid4

            db.add(
                WordExampleModel(
                    id=f"we{uuid4().hex[:12]}",
                    word_id=word_id,
                    sentence=sentence,
                    translation=translation,
                    sort_order=idx,
                )
            )

    db.commit()
    db.refresh(word)
    items = _build_word_items_for_user(db, [word], current_user.id)
    return items[0]


@router.delete("/{word_id}")
def delete_word(
    word_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.word_id == word_id,
            UserWordProgressModel.user_id == current_user.id,
        )
        .first()
    )
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")

    db.delete(progress)
    db.query(DictWordModel).filter(DictWordModel.word_id == word_id).delete()
    db.commit()
    return {"detail": "已删除"}


@router.post("/{word_id}/review")
def review_word(
    word_id: str,
    req: ReviewWordRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = (
        db.query(UserWordProgressModel)
        .filter(
            UserWordProgressModel.word_id == word_id,
            UserWordProgressModel.user_id == current_user.id,
        )
        .first()
    )
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="单词不存在")

    result = apply_sm2_review(
        db,
        current_user.id,
        word_id,
        req.quality,
        req.response_time,
        req.learning_context,
    )
    db.commit()
    return result
