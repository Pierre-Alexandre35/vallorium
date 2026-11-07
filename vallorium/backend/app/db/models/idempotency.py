"""Stored request results for idempotent retries."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class IdempotencyRequest(Base):
    __tablename__ = "idempotency_request"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(String(50), nullable=False)
    key: Mapped[str] = mapped_column(String(64), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_body: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "scope",
            "key",
            name="uq_idempotency_request_scope_key",
        ),
    )
