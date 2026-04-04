from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.article import ArticleItemModel
from app.schemas.article import ArticleCreate, ArticleItem


def list_articles(db: Session, user_id: str) -> list[ArticleItem]:
    rows = db.query(ArticleItemModel).filter(ArticleItemModel.userId == user_id).all()
    return [
        ArticleItem(
            id=r.id,
            title=r.title,
            content=r.content,
            contentZh=r.contentZh,
            type=r.type,
        )
        for r in rows
    ]


def create_article(db: Session, payload: ArticleCreate, user_id: str) -> ArticleItem:
    count = (
        db.query(ArticleItemModel).filter(ArticleItemModel.userId == user_id).count()
    )
    item = ArticleItemModel(
        id=f"a{count + 1}",
        title=payload.title,
        content=payload.content,
        contentZh=payload.contentZh,
        type=payload.type,
        userId=user_id,
    )
    db.add(item)
    db.commit()
    return ArticleItem(
        id=item.id,
        title=item.title,
        content=item.content,
        contentZh=item.contentZh,
        type=item.type,
    )


def delete_article(db: Session, article_id: str, user_id: str) -> None:
    item = (
        db.query(ArticleItemModel)
        .filter(ArticleItemModel.id == article_id, ArticleItemModel.userId == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")
    db.delete(item)
    db.commit()
