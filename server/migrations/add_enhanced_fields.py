"""
Migration script to add enhanced SM2 algorithm fields to the words table
"""


def upgrade():
    """
    Add new columns to support enhanced SM2 algorithm and learning features
    """

    # Enhanced SM2 algorithm fields
    ADD_EFACTOR = "ALTER TABLE words ADD COLUMN efactor REAL DEFAULT 2.5"
    ADD_INTERVAL = "ALTER TABLE words ADD COLUMN interval INTEGER DEFAULT 0"
    ADD_NEXT_REVIEW_DATE = "ALTER TABLE words ADD COLUMN nextReviewDate TEXT DEFAULT (datetime('now', 'utc'))"
    ADD_LAST_REVIEW_DATE = "ALTER TABLE words ADD COLUMN lastReviewDate TEXT"
    ADD_REPETITIONS = "ALTER TABLE words ADD COLUMN repetitions INTEGER DEFAULT 0"

    # New enhanced fields for better learning
    ADD_DIFFICULTY = "ALTER TABLE words ADD COLUMN difficulty INTEGER DEFAULT 3"
    ADD_IMPORTANCE = "ALTER TABLE words ADD COLUMN importance INTEGER DEFAULT 2"
    ADD_CATEGORY = "ALTER TABLE words ADD COLUMN category TEXT DEFAULT 'general'"
    ADD_LEARNING_STREAK = (
        "ALTER TABLE words ADD COLUMN learningStreak INTEGER DEFAULT 0"
    )
    ADD_AVERAGE_QUALITY = "ALTER TABLE words ADD COLUMN averageQuality REAL DEFAULT 0.0"
    ADD_LAST_RESPONSE_QUALITY = (
        "ALTER TABLE words ADD COLUMN lastResponseQuality REAL DEFAULT 0.0"
    )
    ADD_FATIGUE_FACTOR = "ALTER TABLE words ADD COLUMN fatigueFactor REAL DEFAULT 1.0"
    ADD_RESPONSE_TIME = "ALTER TABLE words ADD COLUMN responseTime INTEGER DEFAULT 0"
    ADD_CONTEXTUAL_REVIEWS = (
        "ALTER TABLE words ADD COLUMN contextualReviews INTEGER DEFAULT 0"
    )

    migrations = [
        ADD_EFACTOR,
        ADD_INTERVAL,
        ADD_NEXT_REVIEW_DATE,
        ADD_LAST_REVIEW_DATE,
        ADD_REPETITIONS,
        ADD_DIFFICULTY,
        ADD_IMPORTANCE,
        ADD_CATEGORY,
        ADD_LEARNING_STREAK,
        ADD_AVERAGE_QUALITY,
        ADD_LAST_RESPONSE_QUALITY,
        ADD_FATIGUE_FACTOR,
        ADD_RESPONSE_TIME,
        ADD_CONTEXTUAL_REVIEWS,
    ]

    return migrations


def downgrade():
    """
    Remove the enhanced fields (for rollback)
    """

    DROP_COLUMNS = [
        "ALTER TABLE words DROP COLUMN efactor",
        "ALTER TABLE words DROP COLUMN interval",
        "ALTER TABLE words DROP COLUMN nextReviewDate",
        "ALTER TABLE words DROP COLUMN lastReviewDate",
        "ALTER TABLE words DROP COLUMN repetitions",
        "ALTER TABLE words DROP COLUMN difficulty",
        "ALTER TABLE words DROP COLUMN importance",
        "ALTER TABLE words DROP COLUMN category",
        "ALTER TABLE words DROP COLUMN learningStreak",
        "ALTER TABLE words DROP COLUMN averageQuality",
        "ALTER TABLE words DROP COLUMN lastResponseQuality",
        "ALTER TABLE words DROP COLUMN fatigueFactor",
        "ALTER TABLE words DROP COLUMN responseTime",
        "ALTER TABLE words DROP COLUMN contextualReviews",
    ]

    return DROP_COLUMNS


if __name__ == "__main__":
    import sys
    from sqlalchemy import create_engine, text
    from app.config import settings

    action = sys.argv[1] if len(sys.argv) > 1 else "upgrade"
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )

    if action == "upgrade":
        print("Upgrading database...")
        with engine.connect() as conn:
            for stmt in upgrade():
                try:
                    conn.execute(text(stmt))
                    print(f"  OK: {stmt}")
                except Exception as e:
                    print(f"  SKIP: {stmt} ({e})")
            conn.commit()
        print("Upgrade completed.")
    elif action == "downgrade":
        print("Downgrading database...")
        with engine.connect() as conn:
            for stmt in downgrade():
                try:
                    conn.execute(text(stmt))
                    print(f"  OK: {stmt}")
                except Exception as e:
                    print(f"  SKIP: {stmt} ({e})")
            conn.commit()
        print("Downgrade completed.")
    else:
        print(f"Usage: python {sys.argv[0]} [upgrade|downgrade]")
