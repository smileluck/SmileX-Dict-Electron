import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import UserModel
from app.schemas.auth import AuthResponse, UserOut
from app.utils.security import (
    hash_password,
    verify_password,
    validate_password_strength,
)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def register_user(db: Session, username: str, password: str) -> AuthResponse:
    error = validate_password_strength(password)
    if error:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    existing = db.query(UserModel).filter(UserModel.username == username).first()
    if existing:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    user = UserModel(id=user_id, username=username, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id})
    return AuthResponse(
        access_token=token,
        user=UserOut(id=user.id, username=user.username),
    )


def login_user(db: Session, username: str, password: str) -> AuthResponse:
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token(data={"sub": user.id})
    return AuthResponse(
        access_token=token,
        user=UserOut(id=user.id, username=user.username),
    )
