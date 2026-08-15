import hashlib
import json
from dataclasses import dataclass
from typing import Any, Mapping

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

import app.db.models as db


class IdempotencyKeyReuseError(Exception):
    pass


class IdempotencyStateError(Exception):
    pass


@dataclass(frozen=True)
class IdempotencyClaim:
    request: db.IdempotencyRequest
    is_new: bool


def hash_payload(payload: Mapping[str, Any]) -> str:
    serialized = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    ).encode("utf-8")

    return hashlib.sha256(serialized).hexdigest()


def claim_request(
    db_sess: Session,
    *,
    scope: str,
    key: str,
    request_hash: str,
) -> IdempotencyClaim:
    stmt = (
        insert(db.IdempotencyRequest)
        .values(
            scope=scope,
            key=key,
            request_hash=request_hash,
        )
        .on_conflict_do_nothing(
            index_elements=["scope", "key"],
        )
        .returning(db.IdempotencyRequest.id)
    )

    request_id = db_sess.scalar(stmt)

    if request_id is not None:
        request = db_sess.get(
            db.IdempotencyRequest,
            request_id,
        )

        if request is None:
            raise IdempotencyStateError("Unable to load idempotency request.")

        return IdempotencyClaim(
            request=request,
            is_new=True,
        )

    request = db_sess.scalar(
        select(db.IdempotencyRequest).where(
            db.IdempotencyRequest.scope == scope,
            db.IdempotencyRequest.key == key,
        )
    )

    if request is None:
        raise IdempotencyStateError("Unable to resolve idempotency request.")

    if request.request_hash != request_hash:
        raise IdempotencyKeyReuseError(
            "Idempotency key was already used with a different request."
        )

    if request.response_status is None or request.response_body is None:
        raise IdempotencyStateError("Idempotency request has no stored response.")

    return IdempotencyClaim(
        request=request,
        is_new=False,
    )


def complete_request(
    request: db.IdempotencyRequest,
    *,
    response_status: int,
    response_body: dict,
) -> None:
    request.response_status = response_status
    request.response_body = response_body
