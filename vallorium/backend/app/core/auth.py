import jwt
from fastapi import Depends, HTTPException, status
from jwt import PyJWTError

import app.db.session as session
from app.domains.auth.schemas import TokenData
from app.domains.users.schemas import UserCreate
import app.domains.users.service as user_service
from app.core import security
import app.db.models as models


async def get_current_user(
    db=Depends(session.get_db), token: str = Depends(security.oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        permissions: str = payload.get("permissions")
        token_data = TokenData(email=email, permissions=permissions)
    except PyJWTError:
        raise credentials_exception
    user = user_service.get_user_by_email(db, token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def authenticate_user(db, email: str, password: str):
    user = user_service.get_user_by_email_raw(db, email)
    if not user:
        return False
    if not security.verify_password(password, user.hashed_password):
        return False
    return user


def sign_up_new_user(db, email: str, password: str, tribe_id: int):
    user = user_service.get_user_by_email(db, email)
    if user:
        return False  # User already exists
    new_user = user_service.create_user(
        db,
        UserCreate(
            email=email,
            password=password,
            tribe_id=tribe_id,
            is_active=True,
            is_superuser=False,
        ),
    )
    return new_user
