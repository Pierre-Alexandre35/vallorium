from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status,
)

from app.core.auth import (
    authenticate_user,
    get_current_active_user,
    sign_up_new_user,
)
from app.core.sessions import (
    SESSION_COOKIE_NAME,
    clear_session_cookie,
    create_session,
    delete_session,
    set_session_cookie,
)
from app.db.session import get_db
from app.domains.auth.schemas import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
)

auth_router = r = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@r.post(
    "/login",
    response_model=AuthResponse,
)
async def login(
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

    session_id = await create_session(user.id)

    set_session_cookie(
        response,
        session_id,
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "is_superuser": user.is_superuser,
        }
    }


@r.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    data: SignupRequest,
    response: Response,
    db=Depends(get_db),
):
    user = sign_up_new_user(
        db,
        email=data.email,
        password=data.password,
        tribe_id=data.tribe_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account already exists",
        )

    session_id = await create_session(user.id)

    set_session_cookie(
        response,
        session_id,
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "is_superuser": user.is_superuser,
        }
    }


@r.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    response: Response,
    session_id: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME,
    ),
):
    if session_id is not None:
        await delete_session(session_id)

    clear_session_cookie(response)


@r.get(
    "/me",
    response_model=AuthResponse,
)
async def me(
    current_user=Depends(get_current_active_user),
):
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "is_superuser": current_user.is_superuser,
        }
    }
