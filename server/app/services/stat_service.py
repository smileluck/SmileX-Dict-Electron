from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.stat import DailyStatModel
from app.schemas.stat import StatItem


def today_str() -> str:
    return date.today().isoformat()


def get_or_create_stat(db: Session, d: str, user_id: str) -> DailyStatModel:
    row = (
        db.query(DailyStatModel)
        .filter(DailyStatModel.date == d, DailyStatModel.userId == user_id)
        .first()
    )
    if not row:
        row = DailyStatModel(
            date=d,
            userId=user_id,
            newCount=0,
            reviewCount=0,
            dictationCount=0,
            wrongCount=0,
        )
        db.add(row)
        db.commit()
    return row


def stat_item_from_model(r: DailyStatModel) -> StatItem:
    return StatItem(
        date=r.date,
        newCount=r.newCount,
        reviewCount=r.reviewCount,
        dictationCount=r.dictationCount,
        wrongCount=r.wrongCount,
    )


def get_today_stat(db: Session, user_id: str) -> StatItem:
    t = today_str()
    row = get_or_create_stat(db, t, user_id)
    return stat_item_from_model(row)


def get_history_stats(db: Session, user_id: str, days: int) -> list[StatItem]:
    today = date.today()
    start = today - timedelta(days=days - 1)
    rows = (
        db.query(DailyStatModel)
        .filter(
            DailyStatModel.date >= start.isoformat(),
            DailyStatModel.date <= today.isoformat(),
            DailyStatModel.userId == user_id,
        )
        .all()
    )
    row_map = {r.date: r for r in rows}
    result = []
    for i in range(days):
        d = (start + timedelta(days=i)).isoformat()
        if d in row_map:
            result.append(stat_item_from_model(row_map[d]))
        else:
            result.append(
                StatItem(
                    date=d, newCount=0, reviewCount=0, dictationCount=0, wrongCount=0
                )
            )
    return result


def add_event(db: Session, user_id: str, event_type: str) -> StatItem:
    t = today_str()
    row = get_or_create_stat(db, t, user_id)
    field_map = {
        "new": "newCount",
        "review": "reviewCount",
        "dictation": "dictationCount",
        "wrong": "wrongCount",
    }
    field = field_map.get(event_type)
    if field:
        setattr(row, field, getattr(row, field) + 1)
    db.commit()
    return stat_item_from_model(row)
