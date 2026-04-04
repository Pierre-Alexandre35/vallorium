import jwt
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from .crypto import get_password_hash, verify_password


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token")


SECRET_KEY = "{{cookiecutter.secret_key}}"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
