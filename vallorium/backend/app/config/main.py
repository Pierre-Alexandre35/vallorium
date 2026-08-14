import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    celery_broker_url: str
    secret_key: str
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=os.getenv("DATABASE_URL"),
        env_file_encoding="utf-8",
    )


settings = Settings()
