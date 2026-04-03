# app/services/user_service.py
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import User

import app.domains.users.repository as user_repo
from app.domains.users.schemas import UserOut, UserCreate
from app.core.security import get_password_hash


def list_users(db: Session, skip=0, limit=100) -> List[UserOut]:
    rows = user_repo.list_users(db, skip, limit)
    return [UserOut.model_validate(u) for u in rows]


def get_user(db: Session, user_id: int) -> Optional[UserOut]:
    row = user_repo.get_user(db, user_id)
    return UserOut.model_validate(row) if row else None


def get_user_by_email(db: Session, email: str) -> Optional[UserOut]:
    user = user_repo.get_user_by_email(db, email)
    return UserOut.model_validate(user) if user else None


def get_user_by_email_raw(db: Session, email: str) -> Optional[User]:
    return user_repo.get_user_by_email(db, email)


def create_user(db: Session, payload: UserCreate) -> UserOut:
    if user_repo.get_user_by_email(db, payload.email):
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="User already exists"
        )

    hashed = get_password_hash(payload.password)
    u = user_repo.insert_user(
        db,
        email=payload.email,
        hashed_password=hashed,
        tribe_id=payload.tribe_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_active=payload.is_active,
        is_superuser=payload.is_superuser,
    )
    db.commit()
    db.refresh(u)
    return UserOut.model_validate(u)
