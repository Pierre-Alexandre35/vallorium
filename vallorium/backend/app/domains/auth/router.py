from typing import Annotated

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    Header,
    HTTPException,
    Response,
    status,
)

from app.core.auth import (
    authenticate_user,
    get_current_active_user,
    session_user_from_model,
)
from app.core.sessions import (
    SESSION_COOKIE_NAME,
    SessionUser,
    clear_session_cookie,
    create_session,
    delete_session,
    set_session_cookie,
)
from app.db.session import get_db
import app.domains.auth.service as auth_service
from app.domains.auth.schemas import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
)
import app.domains.villages.repository as village_repo


auth_router = r = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


def _auth_response(user: SessionUser) -> AuthResponse:
    return AuthResponse(
        user={
            "id": user.id,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "tribe_id": user.tribe_id,
            "tribe_name": user.tribe_name,
            "current_village_id": user.current_village_id,
        }
    )


@r.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    data: LoginRequest,
    response: Response,
    db=Depends(get_db),
):
    user = authenticate_user(
        db,
        data.email,
        data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    current_village_id = village_repo.get_first_village_id_for_owner(
        db,
        owner_id=user.id,
    )
    session_user = session_user_from_model(
        user,
        current_village_id=current_village_id,
    )
    session_id = create_session(session_user)

    set_session_cookie(
        response,
        session_id,
    )

    return _auth_response(session_user)


@r.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    data: SignupRequest,
    response: Response,
    idempotency_key: Annotated[
        str,
        Header(
            alias="Idempotency-Key",
            min_length=1,
            max_length=64,
        ),
    ],
    db=Depends(get_db),
):
    auth_response = auth_service.signup(
        db,
        data=data,
        idempotency_key=idempotency_key,
    )

    session_user = SessionUser(
        id=auth_response.user.id,
        email=str(auth_response.user.email),
        is_active=True,
        is_superuser=auth_response.user.is_superuser,
        tribe_id=auth_response.user.tribe_id,
        tribe_name=auth_response.user.tribe_name,
        current_village_id=auth_response.user.current_village_id,
    )
    session_id = create_session(session_user)

    set_session_cookie(
        response,
        session_id,
    )

    return auth_response


@r.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(
    response: Response,
    session_id: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME,
    ),
):
    if session_id is not None:
        delete_session(session_id)

    clear_session_cookie(response)


@r.get(
    "/me",
    response_model=AuthResponse,
)
def me(
    current_user: SessionUser = Depends(get_current_active_user),
):
    return _auth_response(current_user)
