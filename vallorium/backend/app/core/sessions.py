import hashlib
import secrets

from fastapi import Response

from app.core.config import SESSION_COOKIE_SECURE
from app.db.redis import redis_client


SESSION_COOKIE_NAME = "session"
SESSION_TTL_SECONDS = 60 * 60 * 24 * 7


def _session_key(session_id: str) -> str:
    digest = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
    return f"session:{digest}"


def create_session(user_id: int) -> str:
    session_id = secrets.token_urlsafe(32)

    redis_client.set(
        _session_key(session_id),
        str(user_id),
        ex=SESSION_TTL_SECONDS,
    )

    return session_id


def get_session_user_id(
    session_id: str,
) -> int | None:
    value = redis_client.get(_session_key(session_id))

    if value is None:
        return None

    return int(value)


def delete_session(
    session_id: str,
) -> None:
    redis_client.delete(_session_key(session_id))


def set_session_cookie(
    response: Response,
    session_id: str,
) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=SESSION_TTL_SECONDS,
    )


def clear_session_cookie(
    response: Response,
) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )
