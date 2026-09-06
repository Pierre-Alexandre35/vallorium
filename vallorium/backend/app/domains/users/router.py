# app/api/api_v1/routers/users.py

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.auth import (
    get_current_active_superuser,
    get_current_active_user,
)
from app.db.session import get_db
from app.domains.users import service as user_service
from app.domains.users.schemas import (
    UserCreate,
    UserEdit,
    UserOut,
)

users_router = r = APIRouter()


@r.get(
    "/users",
    response_model=list[UserOut],
    response_model_exclude_none=True,
)
def users_list(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Get all users (admin only).
    """
    users = user_service.list_users(
        db,
        skip=skip,
        limit=limit,
    )

    if users:
        response.headers["Content-Range"] = (
            f"{skip}-{skip + len(users) - 1}/{len(users)}"
        )
    else:
        response.headers["Content-Range"] = "0-0/0"

    return users


@r.get(
    "/users/me",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_me(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get the full user profile.

    Authentication itself is served from the Redis session. This endpoint is a
    profile read, so it intentionally loads the richer ORM-backed user shape.
    """
    return user_service.get_user(db, current_user.id)


@r.get(
    "/users/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Get a user by ID (admin only).
    """
    return user_service.get_user(
        db,
        user_id,
    )


@r.post(
    "/users",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_create(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Create a user (admin only).
    """
    return user_service.create_user(
        db,
        user,
    )


@r.put(
    "/users/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_edit(
    user_id: int,
    user: UserEdit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Update a user (admin only).
    """
    return user_service.edit_user(
        db,
        user_id,
        user,
    )


@r.delete(
    "/users/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_delete(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Delete a user (admin only).
    """
    return user_service.delete_user(
        db,
        user_id,
    )
