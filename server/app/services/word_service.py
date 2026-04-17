import uuid

from sqlalchemy.orm import Session

from app.models.word import WordModel
from app.models.word_meaning import WordMeaningModel
from app.models.word_example import WordExampleModel
from app.models.word_grammar import WordGrammarModel
from app.models.word_phrase import WordPhraseModel
from app.models.user_word_progress import UserWordProgressModel
from app.schemas.word import WordItem


def _build_meaning_from_rows(meaning_rows: list) -> str:
    parts = []
    for r in meaning_rows:
        if r.properties and r.description:
            parts.append(f"{r.properties} {r.description}")
        elif r.description:
            parts.append(r.description)
    return "\n".join(parts)


def _build_example_from_rows(example_rows: list) -> str:
    parts = []
    for r in example_rows:
        entry = r.sentence or ""
        if r.translation:
            entry += f"\n{r.translation}"
        if entry:
            parts.append(entry)
    return "\n".join(parts)


def word_item_from_models(
    word: WordModel,
    meaning_rows: list = None,
    example_rows: list = None,
    progress: UserWordProgressModel = None,
    dict_id: str = None,
) -> WordItem:
    meaning_text = _build_meaning_from_rows(meaning_rows) if meaning_rows else ""
    example_text = _build_example_from_rows(example_rows) if example_rows else ""

    syn = []
    if meaning_rows:
        for r in meaning_rows:
            if r.synonym_words:
                syn.extend([s.strip() for s in r.synonym_words.split(",") if s.strip()])

    en_meaning = ""
    if meaning_rows:
        en_parts = [r.description_en for r in meaning_rows if r.description_en]
        en_meaning = "\n".join(en_parts)

    return WordItem(
        id=word.id,
        term=word.term,
        ipa=word.ipa,
        phonetic_uk=word.phonetic_uk,
        phonetic_us=word.phonetic_us,
        meaning=meaning_text,
        enMeaning=en_meaning or None,
        example=example_text or None,
        synonyms=syn,
        synonymsNote=None,
        status=progress.status if progress else "new",
        dictId=dict_id,
    )


def get_or_create_word(db: Session, term: str, lookup_data: dict = None) -> WordModel:
    word = db.query(WordModel).filter(WordModel.term == term).first()
    if word:
        return word

    word_id = f"w{uuid.uuid4().hex[:12]}"
    word = WordModel(
        id=word_id,
        term=term,
        ipa=lookup_data.get("ipa", "") if lookup_data else "",
        phonetic_uk=lookup_data.get("phonetic_uk", "") if lookup_data else "",
        phonetic_us=lookup_data.get("phonetic_us", "") if lookup_data else "",
    )
    db.add(word)
    db.flush()

    if lookup_data:
        meaning_text = lookup_data.get("meaning", "")
        if meaning_text:
            for line in meaning_text.split("\n"):
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
                meaning_id = f"wm{uuid.uuid4().hex[:12]}"
                db.add(
                    WordMeaningModel(
                        id=meaning_id,
                        word_id=word_id,
                        properties=properties,
                        description=description,
                        description_en=lookup_data.get("en_meaning", ""),
                        synonym_words=",".join(lookup_data.get("synonyms", [])),
                    )
                )

        examples = lookup_data.get("examples", [])
        for idx, ex in enumerate(examples):
            parts = ex.split("\n", 1)
            sentence = parts[0].strip()
            translation = parts[1].strip() if len(parts) > 1 else ""
            ex_id = f"we{uuid.uuid4().hex[:12]}"
            db.add(
                WordExampleModel(
                    id=ex_id,
                    word_id=word_id,
                    sentence=sentence,
                    translation=translation,
                    sort_order=idx,
                )
            )

        grammar_list = lookup_data.get("grammar", [])
        for idx, g in enumerate(grammar_list):
            g_id = f"wg{uuid.uuid4().hex[:12]}"
            db.add(
                WordGrammarModel(
                    id=g_id,
                    word_id=word_id,
                    grammar_label=g,
                    sort_order=idx,
                )
            )

        phrases = lookup_data.get("phrases", [])
        for idx, p in enumerate(phrases):
            p_id = f"wp{uuid.uuid4().hex[:12]}"
            p_parts = p.split(None, 1)
            p_text = p_parts[0] if p_parts else p
            p_desc = p_parts[1] if len(p_parts) > 1 else ""
            db.add(
                WordPhraseModel(
                    id=p_id,
                    word_id=word_id,
                    word_text=p_text,
                    word_desc=p_desc,
                    sort_order=idx,
                )
            )

    return word


def get_word_detail(db: Session, word: WordModel) -> dict:
    meaning_rows = (
        db.query(WordMeaningModel)
        .filter(WordMeaningModel.word_id == word.id)
        .order_by(WordMeaningModel.sort_order)
        .all()
    )

    example_rows = (
        db.query(WordExampleModel)
        .filter(WordExampleModel.word_id == word.id)
        .order_by(WordExampleModel.sort_order)
        .all()
    )

    grammar_rows = (
        db.query(WordGrammarModel)
        .filter(WordGrammarModel.word_id == word.id)
        .order_by(WordGrammarModel.sort_order)
        .all()
    )

    phrase_rows = (
        db.query(WordPhraseModel)
        .filter(WordPhraseModel.word_id == word.id)
        .order_by(WordPhraseModel.sort_order)
        .all()
    )

    return {
        "word": word,
        "meanings": meaning_rows,
        "examples": example_rows,
        "grammars": grammar_rows,
        "phrases": phrase_rows,
    }
