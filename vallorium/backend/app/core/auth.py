from fastapi import (
    Cookie,
    Depends,
    HTTPException,
    status,
)

import app.db.models as models
import app.db.session as session

from app.core import security
from app.core.sessions import (
    SESSION_COOKIE_NAME,
    get_session_user_id,
)
import app.domains.users.service as user_service


def get_current_user(
    db=Depends(session.get_db),
    session_id: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME,
    ),
) -> models.User:
    if session_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_id = get_session_user_id(session_id)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    user = user_service.get_user_raw(
        db,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return current_user


def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
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

