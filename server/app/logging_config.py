import json
import logging
import logging.config
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

_LEVEL_COLORS = {
    "DEBUG": "\033[36m",
    "INFO": "\033[32m",
    "WARNING": "\033[33m",
    "ERROR": "\033[31m",
    "CRITICAL": "\033[1;31m",
}
_RESET = "\033[0m"


class _DevFormatter(logging.Formatter):
    _LEVEL_NAME_WIDTH = 5

    def format(self, record: logging.LogRecord) -> str:
        color = _LEVEL_COLORS.get(record.levelname, "")
        level = f"{color}{record.levelname:<{self._LEVEL_NAME_WIDTH}}{_RESET}"
        ts = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S.%f")[
            :-3
        ]
        name = record.name
        msg = record.getMessage()
        line = f"{ts} {level} [{name}] {msg}"
        if record.exc_info and record.exc_info[1] is not None:
            line += "\n" + self.formatException(record.exc_info)
        return line


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "environment": settings.APP_ENV,
        }
        if record.exc_info and record.exc_info[1] is not None:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


def _resolve_level() -> int:
    return getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)


def _log_dir() -> Path:
    base = Path(__file__).resolve().parent.parent
    d = base / settings.LOG_DIR
    d.mkdir(parents=True, exist_ok=True)
    return d


def _dev_config(level: int) -> dict:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {"dev": {"()": _DevFormatter}},
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "dev",
            },
        },
        "loggers": {
            "app": {"handlers": ["console"], "level": level, "propagate": False},
            "uvicorn": {
                "handlers": ["console"],
                "level": "WARNING",
                "propagate": False,
            },
            "sqlalchemy": {
                "handlers": ["console"],
                "level": "WARNING",
                "propagate": False,
            },
        },
        "root": {"handlers": ["console"], "level": "WARNING"},
    }


def _prod_config(level: int, log_dir: Path) -> dict:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {"json": {"()": _JsonFormatter}},
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "json",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(log_dir / "app.log"),
                "maxBytes": 10 * 1024 * 1024,
                "backupCount": 5,
                "encoding": "utf-8",
                "formatter": "json",
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(log_dir / "error.log"),
                "maxBytes": 10 * 1024 * 1024,
                "backupCount": 5,
                "encoding": "utf-8",
                "formatter": "json",
                "level": "ERROR",
            },
        },
        "loggers": {
            "app": {
                "handlers": ["console", "file", "error_file"],
                "level": level,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["console", "file"],
                "level": "WARNING",
                "propagate": False,
            },
            "sqlalchemy": {
                "handlers": ["console", "file"],
                "level": "WARNING",
                "propagate": False,
            },
        },
        "root": {"handlers": ["console", "file"], "level": "WARNING"},
    }


def setup_logging() -> None:
    level = _resolve_level()
    if settings.is_production:
        cfg = _prod_config(level, _log_dir())
    else:
        cfg = _dev_config(level)
    logging.config.dictConfig(cfg)
