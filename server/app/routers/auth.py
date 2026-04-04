from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserModel
from app.schemas.auth import AuthResponse, UserLogin, UserOut, UserRegister
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(db, payload.username, payload.password)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login_user(db, payload.username, payload.password)


@router.get("/me", response_model=UserOut)
def get_me(current_user: UserModel = Depends(get_current_user)):
    return UserOut(id=current_user.id, username=current_user.username)
