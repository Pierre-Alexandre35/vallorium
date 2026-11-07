"""Tribe catalog and advantages."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, enum_values
from .enums import Tribe


class TribeAttributes(Base):
    __tablename__ = "tribe_attributes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[Tribe] = mapped_column(
        SAEnum(
            Tribe,
            values_callable=enum_values,
            native_enum=False,
            length=20,
            name="tribe_enum",
        ),
        unique=True,
        nullable=False,
    )

    # Keep temporarily for backwards compatibility.
    bonus: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    playstyle: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    advantages = relationship(
        "TribeAdvantage",
        back_populates="tribe",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TribeAdvantage.position",
    )

    @property
    def code(self) -> str:
        return self.name.name.lower()


class TribeAdvantage(Base):
    __tablename__ = "tribe_advantage"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    tribe_id: Mapped[int] = mapped_column(
        ForeignKey("tribe_attributes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    tribe = relationship(
        "TribeAttributes",
        back_populates="advantages",
    )

    __table_args__ = (
        UniqueConstraint(
            "tribe_id",
            "code",
            name="uq_tribe_advantage_code",
        ),
        CheckConstraint(
            "position >= 0",
            name="ck_tribe_advantage_position_non_negative",
        ),
    )
