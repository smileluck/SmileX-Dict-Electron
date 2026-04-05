import logging
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

from app.config import settings
from app.database import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import app.models  # noqa: F401, E402

target_metadata = Base.metadata


def get_engine():
    return create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )


def run_upgrade(engine):
    from migrations.add_enhanced_fields import upgrade

    with engine.connect() as conn:
        for stmt in upgrade():
            try:
                conn.execute(text(stmt))
            except Exception:
                logger.warning(f"Column may already exist, skipping: {stmt}")
        conn.commit()
    logger.info("Upgrade completed.")


def run_downgrade(engine):
    from migrations.add_enhanced_fields import downgrade

    with engine.connect() as conn:
        for stmt in downgrade():
            try:
                conn.execute(text(stmt))
            except Exception:
                logger.warning(f"Column may not exist, skipping: {stmt}")
        conn.commit()
    logger.info("Downgrade completed.")


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "upgrade"
    engine = get_engine()

    if action == "upgrade":
        run_upgrade(engine)
    elif action == "downgrade":
        run_downgrade(engine)
    else:
        print(f"Usage: python {sys.argv[0]} [upgrade|downgrade]")
        sys.exit(1)
