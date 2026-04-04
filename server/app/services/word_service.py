from app.models.word import WordItemModel
from app.schemas.word import WordItem


def word_item_from_model(r: WordItemModel) -> WordItem:
    syn: list[str] = []
    if r.synonyms:
        try:
            syn = r.synonyms.split(",")
        except Exception:
            syn = []
    return WordItem(
        id=r.id,
        term=r.term,
        ipa=r.ipa,
        meaning=r.meaning,
        enMeaning=r.enMeaning,
        example=r.example,
        synonyms=syn,
        synonymsNote=r.synonymsNote,
        status=r.status,
        dictId=r.dictId,
    )


def word_model_from_schema(word: WordItem, user_id: str) -> WordItemModel:
    return WordItemModel(
        id=word.id,
        term=word.term,
        ipa=word.ipa,
        meaning=word.meaning,
        enMeaning=word.enMeaning,
        example=word.example,
        synonyms=",".join(word.synonyms or []),
        synonymsNote=word.synonymsNote,
        status=word.status,
        dictId=word.dictId,
        userId=user_id,
    )
