# app/api/api_v1/routers/users.py
from typing import List

from fastapi import APIRouter, Request, Depends, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import (
    get_current_active_user,
    get_current_active_superuser,
)
from app.domains.users.schemas import (
    UserCreate,
    UserEdit,
    UserOut
)

from app.domains.users import service as user_service


users_router = r = APIRouter()


@r.get(
    "/users",
    response_model=List[UserOut],
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
    Get all users (admin)
    """
    users = user_service.list_users(db, skip=skip, limit=limit)

    response.headers["Content-Range"] = (
        f"{skip}-{skip + len(users) - 1}/{len(users)}"
    )
    return users


@r.get("/users/me", response_model=UserOut)
def user_me(current_user=Depends(get_current_active_user)):
    return UserOut.model_validate(current_user)


@r.get(
    "/users/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_details(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Get any user details (admin)
    """
    user = user_service.get_user(db, user_id)
    return user


@r.post("/users", response_model=UserOut, response_model_exclude_none=True)
def user_create(
    request: Request,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Create a new user (admin)
    """
    return user_service.create_user(db, user)


@r.put(
    "/users/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_edit(
    request: Request,
    user_id: int,
    user: UserEdit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Update existing user (admin)
    """
    return user_service.edit_user(db, user_id, user)


@r.delete(
    "/users/{user_id}",
    response_model=UserOut,
    response_model_exclude_none=True,
)
def user_delete(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_superuser),
):
    """
    Delete existing user (admin)
    """
    return user_service.delete_user(db, user_id)
