from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.crypto import get_password_hash
from app.core.idempotency import (
    IdempotencyKeyReuseError,
    IdempotencyStateError,
    claim_request,
    complete_request,
    hash_payload,
)
from app.domains.auth.schemas import AuthResponse, AuthUser, SignupRequest
import app.domains.tribes.repository as tribe_repo
import app.domains.users.repository as user_repo
import app.domains.villages.repository as village_repo
import app.domains.villages.service as village_service


SIGNUP_IDEMPOTENCY_SCOPE = "auth.signup"
STARTING_VILLAGE_NAME = "New Village"


def signup(
    db: Session,
    *,
    data: SignupRequest,
    idempotency_key: str,
) -> AuthResponse:
    request_hash = hash_payload(
        data.model_dump(mode="json"),
    )

    try:
        claim = claim_request(
            db,
            scope=SIGNUP_IDEMPOTENCY_SCOPE,
            key=idempotency_key,
            request_hash=request_hash,
        )

        if not claim.is_new:
            response = AuthResponse.model_validate(
                claim.request.response_body,
            )
            db.commit()
            return response

        if user_repo.get_user_by_email(db, data.email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account already exists",
            )

        tribe = tribe_repo.get_by_id(db, data.tribe_id)
        if tribe is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid tribe",
            )

        user = user_repo.insert_user(
            db,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            tribe_id=data.tribe_id,
            first_name=None,
            last_name=None,
            is_active=True,
            is_superuser=False,
        )

        tile = village_repo.get_random_starter_tile_for_update(db)

        if tile is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No starter map tile is available.",
            )

        village = village_service.initialize_village(
            db,
            name=STARTING_VILLAGE_NAME,
            tile=tile,
            owner_id=user.id,
        )

        tribe_name_raw = getattr(tribe, "name", None)
        tribe_name = getattr(tribe_name_raw, "value", tribe_name_raw)

        response = AuthResponse(
            user=AuthUser(
                id=user.id,
                email=user.email,
                is_superuser=user.is_superuser,
                tribe_id=user.tribe_id,
                tribe_name=tribe_name,
                current_village_id=village.id,
            )
        )

        complete_request(
            claim.request,
            response_status=status.HTTP_201_CREATED,
            response_body=response.model_dump(mode="json"),
        )

        db.commit()
        return response

    except IdempotencyKeyReuseError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except IdempotencyStateError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to resolve idempotent signup request.",
        ) from exc

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Signup conflicts with existing data.",
        ) from exc

    except Exception:
        db.rollback()
        raise
