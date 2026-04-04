from typing import Optional
from app.common.schemas import AppBaseModel


class Token(AppBaseModel):
    access_token: str
    token_type: str


class TokenData(AppBaseModel):
    email: Optional[str] = None
    permissions: str = "user"
