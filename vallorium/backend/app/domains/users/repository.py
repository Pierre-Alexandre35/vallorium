from typing import Optional, Sequence
from sqlalchemy.orm import Session
import app.db.models as db


def get_user(db_sess: Session, user_id: int) -> Optional[db.User]:
    return db_sess.query(db.User).filter(db.User.id == user_id).first()


def get_user_by_email(db_sess: Session, email: str) -> Optional[db.User]:
    return db_sess.query(db.User).filter(db.User.email == email).first()


def list_users(
    db_sess: Session, skip: int = 0, limit: int = 100
) -> Sequence[db.User]:
    return db_sess.query(db.User).offset(skip).limit(limit).all()


def insert_user(
    db_sess: Session,
    *,
    email: str,
    hashed_password: str,
    tribe_id: int,
    first_name: str | None,
    last_name: str | None,
    is_active: bool,
    is_superuser: bool
) -> db.User:
    u = db.User(
        email=email,
        hashed_password=hashed_password,
        tribe_id=tribe_id,
        first_name=first_name,
        last_name=last_name,
        is_active=is_active,
        is_superuser=is_superuser,
    )
    db_sess.add(u)
    db_sess.flush()
    return u
