from pydantic import BaseModel, Field
from typing import List, Optional


class WordItem(BaseModel):
    id: str
    term: str
    ipa: Optional[str] = None
    phonetic_uk: Optional[str] = None
    phonetic_us: Optional[str] = None
    meaning: str = ""
    enMeaning: Optional[str] = None
    example: Optional[str] = None
    synonyms: List[str] = []
    synonymsNote: Optional[str] = None
    status: str = Field(default="new")
    dictId: Optional[str] = None


class WordUpdate(BaseModel):
    term: Optional[str] = None
    ipa: Optional[str] = None
    meaning: Optional[str] = None
    enMeaning: Optional[str] = None
    example: Optional[str] = None
    synonyms: Optional[List[str]] = None
    synonymsNote: Optional[str] = None
    status: Optional[str] = None
    dictId: Optional[str] = None


class WordLookupResult(BaseModel):
    term: str
    ipa: Optional[str] = None
    phonetic_uk: Optional[str] = None
    phonetic_us: Optional[str] = None
    meaning: str
    en_meaning: Optional[str] = None
    examples: List[str] = []
    phrases: List[str] = []
    synonyms: List[str] = []
    grammar: List[str] = []


class WordMeaningItem(BaseModel):
    id: str
    word_id: str
    properties: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    scene: Optional[str] = None
    from_type: Optional[str] = None
    synonym_words: Optional[str] = None
    sort_order: int = 0


class WordExampleItem(BaseModel):
    id: str
    word_id: str
    sentence: Optional[str] = None
    translation: Optional[str] = None
    from_type: Optional[str] = None
    ref: Optional[str] = None
    audio_url: Optional[str] = None
    sort_order: int = 0


class WordGrammarItem(BaseModel):
    id: str
    word_id: str
    grammar_label: Optional[str] = None
    word_text: Optional[str] = None
    to_word_id: Optional[str] = None
    sort_order: int = 0


class WordPhraseItem(BaseModel):
    id: str
    word_id: str
    word_text: Optional[str] = None
    word_desc: Optional[str] = None
    to_word_id: Optional[str] = None
    sort_order: int = 0
