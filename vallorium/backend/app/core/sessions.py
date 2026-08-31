from __future__ import annotations

from dataclasses import asdict, dataclass
import hashlib
import json
import secrets

from fastapi import Response

from app.core.config import SESSION_COOKIE_SECURE
from app.db.redis import redis_client


SESSION_COOKIE_NAME = "__session"
SESSION_TTL_SECONDS = 60 * 60 * 24 * 7


@dataclass(frozen=True)
class SessionUser:
    id: int
    email: str
    is_active: bool
    is_superuser: bool
    tribe_id: int
    tribe_name: str | None
    current_village_id: int | None


def _session_key(session_id: str) -> str:
    digest = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
    return f"session:{digest}"


def _serialize_session_user(user: SessionUser) -> str:
    return json.dumps(asdict(user), separators=(",", ":"))


def _parse_session_value(value: str) -> SessionUser | int | None:
    """Return a rich session user or a legacy integer user id.

    Older deployments stored only the user id in Redis. Keeping that fallback
    lets existing sessions survive this optimization and be upgraded lazily.
    """
    try:
        payload = json.loads(value)
    except json.JSONDecodeError:
        try:
            return int(value)
        except ValueError:
            return None

    if isinstance(payload, int):
        return payload

    if not isinstance(payload, dict):
        return None

    try:
        return SessionUser(
            id=int(payload["id"]),
            email=str(payload["email"]),
            is_active=bool(payload["is_active"]),
            is_superuser=bool(payload["is_superuser"]),
            tribe_id=int(payload["tribe_id"]),
            tribe_name=(
                str(payload["tribe_name"])
                if payload.get("tribe_name") is not None
                else None
            ),
            current_village_id=(
                int(payload["current_village_id"])
                if payload.get("current_village_id") is not None
                else None
            ),
        )
    except (KeyError, TypeError, ValueError):
        return None


def create_session(user: SessionUser) -> str:
    session_id = secrets.token_urlsafe(32)

    redis_client.set(
        _session_key(session_id),
        _serialize_session_user(user),
        ex=SESSION_TTL_SECONDS,
    )

    return session_id


def get_session_user(
    session_id: str,
) -> SessionUser | int | None:
    value = redis_client.get(_session_key(session_id))

    if value is None:
        return None

    return _parse_session_value(value)


def refresh_session_user(
    session_id: str,
    user: SessionUser,
) -> None:
    redis_client.set(
        _session_key(session_id),
        _serialize_session_user(user),
        ex=SESSION_TTL_SECONDS,
    )


def get_session_user_id(
    session_id: str,
) -> int | None:
    session_user = get_session_user(session_id)
    if isinstance(session_user, SessionUser):
        return session_user.id
    if isinstance(session_user, int):
        return session_user
    return None


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
