from pydantic import BaseModel, Field
from typing import List, Optional


class WordItem(BaseModel):
    id: str
    term: str
    ipa: Optional[str] = None
    meaning: str
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
