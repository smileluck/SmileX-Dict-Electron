import json
import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SmileX Dict"
    APP_ENV: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "smilex-dict-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./data/smilex.db"
    ALLOWED_ORIGINS: list[str] = ["*"]
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_UPLOAD_SIZE_MB: int = 5
    MAX_BULK_IMPORT_WORDS: int = 5000
    MAX_QUICK_IMPORT_WORDS: int = 200
    TXT_IMPORT_BATCH_SIZE: int = 20

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


def _load_settings() -> Settings:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        return Settings(_env_file=str(env_path))
    return Settings()


settings = _load_settings()
