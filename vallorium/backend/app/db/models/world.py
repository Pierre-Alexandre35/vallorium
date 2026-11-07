"""World tiles and their resource-field templates."""

from __future__ import annotations

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class MapTileType(Base):
    """Reference template describing one map-tile resource-field layout."""

    __tablename__ = "map_tile_type"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    starter_eligible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    farm_slots = relationship(
        "MapTileTypeFarmSlot",
        back_populates="tile_type",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="MapTileTypeFarmSlot.slot_number",
    )
    map_tiles = relationship(
        "MapTile",
        back_populates="tile_type",
    )


class MapTileTypeFarmSlot(Base):
    """One fixed resource-field slot within a map-tile type."""

    __tablename__ = "map_tile_type_farm_slot"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    map_tile_type_id: Mapped[int] = mapped_column(
        ForeignKey("map_tile_type.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_number: Mapped[int] = mapped_column(Integer, nullable=False)
    resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"),
        nullable=False,
    )

    tile_type = relationship("MapTileType", back_populates="farm_slots")
    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "map_tile_type_id",
            "slot_number",
            name="uq_map_tile_type_farm_slot",
        ),
        CheckConstraint(
            "slot_number BETWEEN 1 AND 18",
            name="ck_map_tile_type_farm_slot_range",
        ),
    )


class MapTile(Base):
    __tablename__ = "map_tile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)
    is_constructible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    map_tile_type_id: Mapped[int] = mapped_column(
        ForeignKey("map_tile_type.id"),
        nullable=False,
        index=True,
    )

    tile_type = relationship("MapTileType", back_populates="map_tiles")
    village = relationship("Village", back_populates="tile", uselist=False)

    __table_args__ = (UniqueConstraint("x", "y", name="uq_tile_coordinates"),)
