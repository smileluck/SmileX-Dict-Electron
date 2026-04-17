"""
Seed script: Import official dictionaries from word list files.

Usage:
    python -m scripts.seed_official_dicts --file data/cet4.txt --name "CET-4" --level cet4
    python -m scripts.seed_official_dicts --file data/cet6.txt --name "CET-6" --level cet6

Word list file format: one word per line, optionally with meaning separated by tab or space:
    abandon
    ability
    absorb  v. 吸收
"""

import argparse
import logging
import sys
import uuid
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timezone

from sqlalchemy import create_engine, text

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_from_file(file_path: str, dict_name: str, level: str, dict_id: str = None):
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )

    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    now = datetime.now(timezone.utc).isoformat()

    if not dict_id:
        dict_id = f"od_{uuid.uuid4().hex[:12]}"

    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM dicts WHERE name = :name AND is_official = 1"),
            {"name": dict_name},
        ).fetchone()
        if existing:
            dict_id = existing[0]
            logger.info(
                f"Official dict '{dict_name}' already exists with id={dict_id}, appending words"
            )
        else:
            conn.execute(
                text(
                    "INSERT INTO dicts (id, name, source, is_official, word_count, user_id, created_at, updated_at) "
                    "VALUES (:id, :name, 'official', 1, 0, NULL, :now, :now)"
                ),
                {"id": dict_id, "name": dict_name, "now": now},
            )
            conn.commit()
            logger.info(f"Created official dict: {dict_name} (id={dict_id})")

        imported = 0
        skipped = 0

        for line in lines:
            parts = line.split(None, 1)
            term = parts[0].strip().lower()
            meaning_text = parts[1].strip() if len(parts) > 1 else ""

            if not term:
                continue

            existing_word = conn.execute(
                text("SELECT id FROM words WHERE term = :term"),
                {"term": term},
            ).fetchone()

            if existing_word:
                word_id = existing_word[0]
            else:
                word_id = f"w{uuid.uuid4().hex[:12]}"
                conn.execute(
                    text(
                        "INSERT INTO words (id, term, level, created_at, updated_at) "
                        "VALUES (:id, :term, :level, :now, :now)"
                    ),
                    {"id": word_id, "term": term, "level": level, "now": now},
                )

                if meaning_text:
                    meaning_id = f"wm{uuid.uuid4().hex[:12]}"
                    conn.execute(
                        text(
                            "INSERT INTO word_meanings (id, word_id, description, sort_order) "
                            "VALUES (:id, :word_id, :desc, 0)"
                        ),
                        {"id": meaning_id, "word_id": word_id, "desc": meaning_text},
                    )

            existing_link = conn.execute(
                text(
                    "SELECT id FROM dict_words WHERE dict_id = :dict_id AND word_id = :word_id"
                ),
                {"dict_id": dict_id, "word_id": word_id},
            ).fetchone()

            if existing_link:
                skipped += 1
                continue

            dw_id = f"dw{uuid.uuid4().hex[:12]}"
            conn.execute(
                text(
                    "INSERT INTO dict_words (id, dict_id, word_id, added_at) "
                    "VALUES (:id, :dict_id, :word_id, :now)"
                ),
                {"id": dw_id, "dict_id": dict_id, "word_id": word_id, "now": now},
            )
            imported += 1

            if imported % 500 == 0:
                conn.commit()
                logger.info(f"  ... {imported} words imported")

        actual_count = conn.execute(
            text("SELECT COUNT(*) FROM dict_words WHERE dict_id = :dict_id"),
            {"dict_id": dict_id},
        ).scalar()

        conn.execute(
            text(
                "UPDATE dicts SET word_count = :count, updated_at = :now WHERE id = :id"
            ),
            {"count": actual_count, "now": now, "id": dict_id},
        )
        conn.commit()

        logger.info(
            f"Done: imported={imported}, skipped={skipped}, total_in_dict={actual_count}"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed official dictionaries from word list files"
    )
    parser.add_argument(
        "--file", required=True, help="Path to word list file (one word per line)"
    )
    parser.add_argument("--name", required=True, help="Dictionary name (e.g. 'CET-4')")
    parser.add_argument(
        "--level", default="", help="Word level tag (e.g. cet4, cet6, toefl)"
    )
    parser.add_argument("--dict-id", default=None, help="Optional fixed dict ID")
    args = parser.parse_args()

    seed_from_file(args.file, args.name, args.level, args.dict_id)
