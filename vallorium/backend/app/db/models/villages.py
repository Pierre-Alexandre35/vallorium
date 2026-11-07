"""Village ownership and world placement."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Village(Base):
    __tablename__ = "village"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    map_tile_id: Mapped[int] = mapped_column(
        ForeignKey("map_tile.id"),
        unique=True,
        nullable=False,
    )
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    population: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    tile = relationship("MapTile", back_populates="village")
    owner = relationship("User", back_populates="villages")
    farms = relationship(
        "VillageFarmPlot",
        back_populates="village",
        cascade="all, delete-orphan",
    )
    buildings = relationship(
        "VillageBuilding",
        back_populates="village",
        cascade="all, delete-orphan",
    )
    resource_storage = relationship(
        "VillageResourceStorage",
        back_populates="village",
        cascade="all, delete-orphan",
    )
    resource_transactions = relationship(
        "VillageResourceTransaction",
        back_populates="village",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "owner_id",
            "name",
            name="uq_owner_village_name",
        ),
        CheckConstraint(
            "population >= 0",
            name="ck_village_population_non_negative",
        ),
    )
