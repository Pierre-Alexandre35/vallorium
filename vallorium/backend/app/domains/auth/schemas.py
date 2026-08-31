from pydantic import EmailStr, Field

from app.common.schemas import AppBaseModel


class SignupRequest(AppBaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    tribe_id: int


class LoginRequest(AppBaseModel):
    email: EmailStr
    password: str = Field(
        min_length=1,
        max_length=128,
    )


class AuthUser(AppBaseModel):
    id: int
    email: EmailStr
    is_superuser: bool
    tribe_id: int
    tribe_name: str | None = None
    current_village_id: int | None = None


class AuthResponse(AppBaseModel):
    user: AuthUser
