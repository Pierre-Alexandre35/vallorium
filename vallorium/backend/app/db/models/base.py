"""Shared SQLAlchemy base and enum persistence helper."""

from __future__ import annotations

from enum import Enum

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def enum_values(enum_class: type[Enum]) -> list[str]:
    """Persist enum values rather than Python member names."""
    return [str(member.value) for member in enum_class]
