from app.models.user import UserModel
from app.models.dict import DictModel
from app.models.dict_word import DictWordModel
from app.models.word import WordModel
from app.models.word_meaning import WordMeaningModel
from app.models.word_example import WordExampleModel
from app.models.word_grammar import WordGrammarModel
from app.models.word_phrase import WordPhraseModel
from app.models.user_word_progress import UserWordProgressModel
from app.models.article import ArticleItemModel
from app.models.stat import DailyStatModel
from app.models.settings import UserSettingsModel

__all__ = [
    "UserModel",
    "DictModel",
    "DictWordModel",
    "WordModel",
    "WordMeaningModel",
    "WordExampleModel",
    "WordGrammarModel",
    "WordPhraseModel",
    "UserWordProgressModel",
    "ArticleItemModel",
    "DailyStatModel",
    "UserSettingsModel",
]
