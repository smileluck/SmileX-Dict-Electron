"""
Migration: Refactor dict structure

Strategy for SQLite:
1. Create new tables with '_new' suffix
2. Migrate data from old tables
3. Drop old tables
4. Rename new tables to original names
"""

import uuid


def upgrade():
    stmts = []

    # ---- Step 1: Create _new tables ----

    stmts.append("""
    CREATE TABLE IF NOT EXISTS words_new (
        id TEXT PRIMARY KEY,
        term TEXT NOT NULL,
        ipa TEXT,
        phonetic_uk TEXT,
        phonetic_us TEXT,
        phonetic_uk_url TEXT,
        phonetic_us_url TEXT,
        level TEXT,
        tags TEXT,
        created_at DATETIME,
        updated_at DATETIME
    )
    """)
    stmts.append("CREATE UNIQUE INDEX IF NOT EXISTS uq_words_term ON words_new (term)")
    stmts.append("CREATE INDEX IF NOT EXISTS ix_words_new_term ON words_new (term)")

    stmts.append("""
    CREATE TABLE IF NOT EXISTS word_meanings_new (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL REFERENCES words_new (id),
        properties TEXT,
        description TEXT,
        description_en TEXT,
        scene TEXT,
        from_type TEXT,
        synonym_ids TEXT,
        synonym_words TEXT,
        sort_order INTEGER DEFAULT 0
    )
    """)
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_word_meanings_new_word_id ON word_meanings_new (word_id)"
    )

    stmts.append("""
    CREATE TABLE IF NOT EXISTS word_examples_new (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL REFERENCES words_new (id),
        sentence TEXT,
        translation TEXT,
        from_type TEXT,
        ref TEXT,
        audio_url TEXT,
        sort_order INTEGER DEFAULT 0
    )
    """)
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_word_examples_new_word_id ON word_examples_new (word_id)"
    )

    stmts.append("""
    CREATE TABLE IF NOT EXISTS word_grammars_new (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL REFERENCES words_new (id),
        grammar_label TEXT,
        word_text TEXT,
        to_word_id TEXT,
        sort_order INTEGER DEFAULT 0
    )
    """)
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_word_grammars_new_word_id ON word_grammars_new (word_id)"
    )

    stmts.append("""
    CREATE TABLE IF NOT EXISTS word_phrases_new (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL REFERENCES words_new (id),
        word_text TEXT,
        word_desc TEXT,
        to_word_id TEXT,
        sort_order INTEGER DEFAULT 0
    )
    """)
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_word_phrases_new_word_id ON word_phrases_new (word_id)"
    )

    stmts.append("""
    CREATE TABLE IF NOT EXISTS dicts_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        cover_url TEXT,
        source TEXT DEFAULT 'custom',
        is_official INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        user_id TEXT REFERENCES users (id),
        created_at DATETIME,
        updated_at DATETIME
    )
    """)
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_dicts_new_user_id ON dicts_new (user_id)"
    )

    stmts.append("""
    CREATE TABLE IF NOT EXISTS dict_words_new (
        id TEXT PRIMARY KEY,
        dict_id TEXT NOT NULL REFERENCES dicts_new (id),
        word_id TEXT NOT NULL REFERENCES words_new (id),
        sort_order INTEGER DEFAULT 0,
        added_at DATETIME
    )
    """)
    stmts.append(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_dict_word_new ON dict_words_new (dict_id, word_id)"
    )
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_dict_words_new_dict_id ON dict_words_new (dict_id)"
    )
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_dict_words_new_word_id ON dict_words_new (word_id)"
    )

    stmts.append("""
    CREATE TABLE IF NOT EXISTS user_word_progress_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users (id),
        word_id TEXT NOT NULL REFERENCES words_new (id),
        status TEXT DEFAULT 'new',
        efactor REAL DEFAULT 2.5,
        interval INTEGER DEFAULT 0,
        next_review_date TEXT,
        last_review_date TEXT,
        repetitions INTEGER DEFAULT 0,
        difficulty INTEGER DEFAULT 3,
        importance INTEGER DEFAULT 2,
        category TEXT DEFAULT 'general',
        learning_streak INTEGER DEFAULT 0,
        average_quality REAL DEFAULT 0.0,
        last_response_quality REAL DEFAULT 0.0,
        fatigue_factor REAL DEFAULT 1.0,
        response_time INTEGER DEFAULT 0,
        contextual_reviews INTEGER DEFAULT 0
    )
    """)
    stmts.append(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_user_word_new ON user_word_progress_new (user_id, word_id)"
    )
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_user_word_progress_new_user_id ON user_word_progress_new (user_id)"
    )
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_user_word_progress_new_word_id ON user_word_progress_new (word_id)"
    )

    return stmts


def migrate_data(conn):
    """
    Data migration must be done via Python because we need to:
    - Deduplicate words by term
    - Split meaning/example text fields into multiple rows
    - Generate new IDs
    """
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()

    # ---- Migrate words (deduplicate by term) ----
    # For each unique term, pick the first row (by id) and create a WordModel
    rows = conn.execute(
        "SELECT term, MIN(id) as first_id, ipa FROM words GROUP BY term ORDER BY MIN(id)"
    ).fetchall()

    term_to_new_id = {}
    for row in rows:
        term, _old_id, ipa = row[0], row[1], row[2]
        new_id = f"w{uuid.uuid4().hex[:12]}"
        term_to_new_id[term] = new_id
        conn.execute(
            "INSERT OR IGNORE INTO words_new (id, term, ipa, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (new_id, term, ipa, now, now),
        )
    conn.commit()

    # ---- Migrate meanings ----
    # old meaning is newline-separated text, each line may start with pos like "n. xxx"
    all_words = conn.execute(
        "SELECT id, term, meaning, enMeaning, synonyms, synonymsNote FROM words"
    ).fetchall()
    word_id_to_term = {r[0]: r[1] for r in all_words}
    meaning_lines_cache = {}

    for row in all_words:
        old_word_id, term, meaning, en_meaning, synonyms, synonyms_note = row
        new_word_id = term_to_new_id.get(term)
        if not new_word_id:
            continue

        if meaning:
            lines = [l.strip() for l in meaning.split("\n") if l.strip()]
            for idx, line in enumerate(lines):
                meaning_id = f"wm{uuid.uuid4().hex[:12]}"
                properties = ""
                description = line
                try:
                    dot_idx = line.index(".")
                    properties = line[: dot_idx + 1].strip()
                    description = line[dot_idx + 1 :].strip()
                except ValueError:
                    pass
                conn.execute(
                    "INSERT OR IGNORE INTO word_meanings_new (id, word_id, properties, description, description_en, synonym_words, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        meaning_id,
                        new_word_id,
                        properties,
                        description,
                        en_meaning,
                        synonyms,
                        idx,
                    ),
                )

        if not meaning:
            meaning_id = f"wm{uuid.uuid4().hex[:12]}"
            conn.execute(
                "INSERT OR IGNORE INTO word_meanings_new (id, word_id, description, description_en, synonym_words, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                (meaning_id, new_word_id, meaning or "", en_meaning, synonyms, 0),
            )

    conn.commit()

    # ---- Migrate examples ----
    for row in all_words:
        old_word_id, term = row[0], row[1]
        new_word_id = term_to_new_id.get(term)
        if not new_word_id:
            continue
        example = conn.execute(
            "SELECT example FROM words WHERE id = ?", (old_word_id,)
        ).fetchone()
        if example and example[0]:
            lines = [l.strip() for l in example[0].split("\n") if l.strip()]
            for idx, line in enumerate(lines):
                ex_id = f"we{uuid.uuid4().hex[:12]}"
                sentence = line
                translation = ""
                conn.execute(
                    "INSERT OR IGNORE INTO word_examples_new (id, word_id, sentence, translation, sort_order) VALUES (?, ?, ?, ?, ?)",
                    (ex_id, new_word_id, sentence, translation, idx),
                )
    conn.commit()

    # ---- Migrate dicts ----
    old_dicts = conn.execute(
        "SELECT id, name, wordCount, source, userId FROM dicts"
    ).fetchall()
    for row in old_dicts:
        dict_id, name, word_count, source, user_id = row
        conn.execute(
            "INSERT OR IGNORE INTO dicts_new (id, name, source, is_official, word_count, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (dict_id, name, source, 0, word_count or 0, user_id, now, now),
        )
    conn.commit()

    # ---- Migrate dict_words ----
    for row in all_words:
        old_word_id, term = row[0], row[1]
        new_word_id = term_to_new_id.get(term)
        if not new_word_id:
            continue
        dict_id_row = conn.execute(
            "SELECT dictId FROM words WHERE id = ?", (old_word_id,)
        ).fetchone()
        if dict_id_row and dict_id_row[0]:
            dict_id = dict_id_row[0]
            dw_id = f"dw{uuid.uuid4().hex[:12]}"
            conn.execute(
                "INSERT OR IGNORE INTO dict_words_new (id, dict_id, word_id, added_at) VALUES (?, ?, ?, ?)",
                (dw_id, dict_id, new_word_id, now),
            )
    conn.commit()

    # ---- Migrate user_word_progress ----
    progress_rows = conn.execute(
        "SELECT id, userId, term, status, efactor, interval, nextReviewDate, lastReviewDate, "
        "repetitions, difficulty, importance, category, learningStreak, averageQuality, "
        "lastResponseQuality, fatigueFactor, responseTime, contextualReviews "
        "FROM words"
    ).fetchall()
    for row in progress_rows:
        old_id, user_id, term, status = row[0], row[1], row[2], row[3]
        efactor, interval_val = row[4], row[5]
        next_review_date, last_review_date = row[6], row[7]
        repetitions, difficulty, importance, category = row[8], row[9], row[10], row[11]
        learning_streak, avg_quality = row[12], row[13]
        last_resp_quality, fatigue_factor = row[14], row[15]
        response_time, contextual_reviews = row[16], row[17]

        new_word_id = term_to_new_id.get(term)
        if not new_word_id or not user_id:
            continue

        progress_id = f"up{uuid.uuid4().hex[:12]}"
        try:
            conn.execute(
                "INSERT OR IGNORE INTO user_word_progress_new "
                "(id, user_id, word_id, status, efactor, interval, next_review_date, last_review_date, "
                "repetitions, difficulty, importance, category, learning_streak, average_quality, "
                "last_response_quality, fatigue_factor, response_time, contextual_reviews) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    progress_id,
                    user_id,
                    new_word_id,
                    status or "new",
                    efactor or 2.5,
                    interval_val or 0,
                    next_review_date,
                    last_review_date,
                    repetitions or 0,
                    difficulty or 3,
                    importance or 2,
                    category or "general",
                    learning_streak or 0,
                    avg_quality or 0.0,
                    last_resp_quality or 0.0,
                    fatigue_factor or 1.0,
                    response_time or 0,
                    contextual_reviews or 0,
                ),
            )
        except Exception:
            pass
    conn.commit()


def swap_tables(conn):
    stmts = [
        "ALTER TABLE words RENAME TO words_old",
        "ALTER TABLE words_new RENAME TO words",
        "ALTER TABLE word_meanings RENAME TO word_meanings_old",
        "ALTER TABLE word_meanings_new RENAME TO word_meanings",
        "ALTER TABLE word_examples RENAME TO word_examples_old",
        "ALTER TABLE word_examples_new RENAME TO word_examples",
        "ALTER TABLE word_grammars RENAME TO word_grammars_old",
        "ALTER TABLE word_grammars_new RENAME TO word_grammars",
        "ALTER TABLE word_phrases RENAME TO word_phrases_old",
        "ALTER TABLE word_phrases_new RENAME TO word_phrases",
        "ALTER TABLE dicts RENAME TO dicts_old",
        "ALTER TABLE dicts_new RENAME TO dicts",
        "ALTER TABLE dict_words RENAME TO dict_words_old",
        "ALTER TABLE dict_words_new RENAME TO dict_words",
        "ALTER TABLE user_word_progress RENAME TO user_word_progress_old",
        "ALTER TABLE user_word_progress_new RENAME TO user_word_progress",
    ]

    existing_tables = {
        r[0]
        for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }

    swap_pairs = [
        ("words", "words_new"),
        ("word_meanings", "word_meanings_new"),
        ("word_examples", "word_examples_new"),
        ("word_grammars", "word_grammars_new"),
        ("word_phrases", "word_phrases_new"),
        ("dicts", "dicts_new"),
        ("dict_words", "dict_words_new"),
        ("user_word_progress", "user_word_progress_new"),
    ]

    executed = []
    for old_name, new_name in swap_pairs:
        old_exists = old_name in existing_tables
        new_exists = new_name in existing_tables

        if new_exists:
            if old_exists:
                old_backup = f"{old_name}_old"
                if old_backup in existing_tables:
                    conn.execute(f"DROP TABLE IF EXISTS [{old_backup}]")
                conn.execute(f"ALTER TABLE [{old_name}] RENAME TO [{old_backup}]")
                executed.append(f"{old_name} -> {old_backup}")
            conn.execute(f"ALTER TABLE [{new_name}] RENAME TO [{old_name}]")
            executed.append(f"{new_name} -> {old_name}")

    conn.commit()
    return executed


def downgrade():
    return [
        "DROP TABLE IF EXISTS user_word_progress",
        "DROP TABLE IF EXISTS dict_words",
        "DROP TABLE IF EXISTS dicts",
        "DROP TABLE IF EXISTS word_phrases",
        "DROP TABLE IF EXISTS word_grammars",
        "DROP TABLE IF EXISTS word_examples",
        "DROP TABLE IF EXISTS word_meanings",
        "DROP TABLE IF EXISTS words",
    ]


if __name__ == "__main__":
    import sys
    import logging
    from sqlalchemy import create_engine, text
    from app.config import settings

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    action = sys.argv[1] if len(sys.argv) > 1 else "upgrade"
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )

    if action == "upgrade":
        logger.info("Creating new tables...")
        with engine.connect() as conn:
            for stmt in upgrade():
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    logger.warning(f"Skip: {e}")
            conn.commit()

        logger.info("Migrating data...")
        with engine.connect() as conn:
            existing = {
                r[0]
                for r in conn.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table'")
                ).fetchall()
            }
            if "words" in existing and "words_new" in existing:
                migrate_data(conn)
            else:
                logger.warning("Source tables not found, skipping data migration")

        logger.info("Swapping tables...")
        with engine.connect() as conn:
            executed = swap_tables(conn)
            for line in executed:
                logger.info(f"  Renamed: {line}")

        logger.info("Upgrade completed.")

    elif action == "downgrade":
        logger.info("Downgrading...")
        with engine.connect() as conn:
            for stmt in downgrade():
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    logger.warning(f"Skip: {e}")
            conn.commit()
        logger.info("Downgrade completed.")
    else:
        print(f"Usage: python {sys.argv[0]} [upgrade|downgrade]")
        sys.exit(1)
