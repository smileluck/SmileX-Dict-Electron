from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserModel
from app.schemas.article import ArticleCreate, ArticleItem
from app.services import article_service

router = APIRouter()


@router.get("", response_model=List[ArticleItem])
def list_articles(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    return article_service.list_articles(db, current_user.id)


@router.post("", response_model=ArticleItem)
def create_article(
    payload: ArticleCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return article_service.create_article(db, payload, current_user.id)


@router.delete("/{article_id}")
def delete_article(
    article_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article_service.delete_article(db, article_id, current_user.id)
    return {"detail": "已删除"}
