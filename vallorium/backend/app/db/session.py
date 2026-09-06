from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core import config


engine = create_engine(
    config.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=config.DB_POOL_PRE_PING,
    pool_recycle=config.DB_POOL_RECYCLE_SECONDS,
    pool_size=config.DB_POOL_SIZE,
    max_overflow=config.DB_MAX_OVERFLOW,
    pool_timeout=config.DB_POOL_TIMEOUT_SECONDS,
)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
