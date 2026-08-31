from __future__ import annotations

from fastapi import Cookie, Depends, HTTPException, status

import app.db.models as models
import app.db.session as session

from app.core import security
from app.core.sessions import (
    SESSION_COOKIE_NAME,
    SessionUser,
    get_session_user,
    refresh_session_user,
)
import app.domains.users.service as user_service
import app.domains.villages.repository as village_repo


def _enum_value(value: object | None) -> str | None:
    if value is None:
        return None
    return str(getattr(value, "value", value))


def session_user_from_model(
    user: models.User,
    *,
    current_village_id: int | None,
) -> SessionUser:
    tribe = getattr(user, "tribe", None)
    return SessionUser(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        tribe_id=user.tribe_id,
        tribe_name=_enum_value(getattr(tribe, "name", None)),
        current_village_id=current_village_id,
    )


def get_current_user(
    db=Depends(session.get_db),
    session_id: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME,
    ),
) -> SessionUser:
    if session_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    session_value = get_session_user(session_id)

    if session_value is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    if isinstance(session_value, SessionUser):
        return session_value

    # Backwards compatibility for sessions created before rich session data was
    # introduced. This DB path runs once, then the Redis value is upgraded.
    user = user_service.get_user_raw(db, session_value)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    current_village_id = village_repo.get_first_village_id_for_owner(
        db,
        owner_id=user.id,
    )
    upgraded_session = session_user_from_model(
        user,
        current_village_id=current_village_id,
    )
    refresh_session_user(session_id, upgraded_session)
    return upgraded_session


def get_current_active_user(
    current_user: SessionUser = Depends(get_current_user),
) -> SessionUser:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return current_user


def get_current_active_superuser(
    current_user: SessionUser = Depends(get_current_user),
) -> SessionUser:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )

    return current_user


def authenticate_user(
    db,
    email: str,
    password: str,
) -> models.User | None:
    user = user_service.get_user_by_email_raw(
        db,
        email,
    )

    if user is None:
        return None

    if not security.verify_password(
        password,
        user.hashed_password,
    ):
        return None

    return user
