from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status, Form
from datetime import timedelta

from app.db.session import get_db
from app.core import security
from app.core.auth import authenticate_user, sign_up_new_user

auth_router = r = APIRouter()


@r.post("/token")
async def login(
    db=Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    if user.is_superuser:
        permissions = "admin"
    else:
        permissions = "user"
    access_token = security.create_access_token(
        data={"sub": user.email, "permissions": permissions},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


class ExtendedOAuth2PasswordRequestForm(OAuth2PasswordRequestForm):
    def __init__(
        self,
        username: str = Form(...),
        password: str = Form(...),
        tribe_id: int = Form(...),  # ✅ Correctly pass `tribe_id`
        scope: str = Form(""),  # ✅ Explicitly define `scope`
    ):
        super().__init__(
            username=username, password=password, scope=scope
        )  # ✅ Pass scope correctly
        self.tribe_id = tribe_id  # ✅ Store `tribe_id`


@r.post("/signup")
async def signup(
    db=Depends(get_db), form_data: ExtendedOAuth2PasswordRequestForm = Depends()
):
    """
    Register a new user with tribe selection
    """
    print("Processing signup request")  # ✅ Debugging print
    print("Received tribe_id:", form_data.tribe_id)

    user = sign_up_new_user(
        db,
        form_data.username,  # ✅ OAuth2 expects "username", not "email"
        form_data.password,
        form_data.tribe_id,  # ✅ Ensure `tribe_id` is passed
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account already exists",
        )

    # ✅ Generate access token
    access_token_expires = timedelta(
        minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = security.create_access_token(
        data={"sub": user.email, "permissions": "user"},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}