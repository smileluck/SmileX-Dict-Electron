import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.logging_config import setup_logging
from app.middleware import (
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
    register_exception_handlers,
)
from app.routers import (
    articles,
    auth,
    data,
    dicts,
    health,
    settings as settings_router,
    stats,
    words,
)

setup_logging()

logger = logging.getLogger("app")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    _register_middleware(app)
    _register_routers(app)
    register_exception_handlers(app)
    _init_db(app)

    logger.info(
        f"{settings.APP_NAME} started (ENV={settings.APP_ENV}, DEBUG={settings.DEBUG})"
    )
    return app


def _register_middleware(app: FastAPI):
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def _register_routers(app: FastAPI):
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(dicts.router, prefix="/api/dicts", tags=["Dicts"])
    app.include_router(words.router, prefix="/api/words", tags=["Words"])
    app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
    app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])
    app.include_router(
        settings_router.router, prefix="/api/settings", tags=["Settings"]
    )
    app.include_router(data.router, prefix="/api", tags=["Data"])
    app.include_router(health.router, prefix="/api", tags=["Health"])


def _init_db(app: FastAPI):
    @app.on_event("startup")
    def on_startup():
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured")


app = create_app()
