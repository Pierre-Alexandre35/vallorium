from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Boolean,
    UniqueConstraint,
    Enum as SAEnum,
)
from enum import Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from typing import Optional
from datetime import datetime

Base = declarative_base()


# ------------------------------
# 1️⃣ Tribe Enumeration
# ------------------------------


class Tribe(str, Enum):
    ROMANS = "Romans"
    TEUTONS = "Teutons"
    GAULS = "Gauls"


class Resource(str, Enum):
    WOOD = "Wood"
    CLAY = "Clay"
    IRON = "Iron"
    CROP = "Crop"


# ------------------------------
# 2️⃣ Resources Types Table (Corrected)
# ------------------------------
class ResourcesTypes(Base):
    __tablename__ = "resources_types"  # ✅ Fixed typo

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[Resource] = mapped_column(
        SAEnum(Resource), unique=True, nullable=False
    )


# ------------------------------
# 3️⃣ Tribe Attributes Table
# ------------------------------
class TribeAttributes(Base):
    __tablename__ = "tribe_attributes"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[Tribe] = mapped_column(
        SAEnum(Tribe), unique=True, nullable=False
    )
    bonus: Mapped[Optional[str]] = mapped_column(String, nullable=True)


# ------------------------------
# 4️⃣ User Table (Fixed)
# ------------------------------
class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False
    )
    first_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    tribe_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tribe_attributes.id"), nullable=False
    )
    tribe = relationship("TribeAttributes")

    villages = relationship(
        "Village", back_populates="owner", cascade="all, delete"
    )


# ------------------------------
# 5️⃣ Village Table (Fixed `ForeignKey`)
# ------------------------------
class Village(Base):
    __tablename__ = "village"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    map_tile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("map_tile.id"), unique=True, nullable=False
    )

    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id"), nullable=True
    )
    population: Mapped[int] = mapped_column(Integer, nullable=False)

    tile = relationship("MapTile", back_populates="village")
    owner = relationship("User", back_populates="villages")
    farms = relationship("VillageFarmPlot", back_populates="village")


# ------------------------------
# 6️⃣ Production Table (Fixed FK Reference)
# ------------------------------
class Production(Base):
    __tablename__ = "production"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    resource_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources_types.id"), nullable=False  # ✅ Fixed
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    production_value: Mapped[int] = mapped_column(Integer, nullable=False)

    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint("resource_type_id", "level", name="uq_resource_level"),
    )


# ------------------------------
# 7️⃣ Village Farms Table (Fixed FKs)
# ------------------------------
class VillageFarmPlot(Base):
    __tablename__ = "village_farm_plots"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    village_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("village.id"), nullable=False  # ✅ Fixed
    )
    resource_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources_types.id"), nullable=False  # ✅ Fixed
    )
    farm_number: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    village = relationship("Village", back_populates="farms")
    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "village_id",
            "resource_type_id",
            "farm_number",
            name="uq_village_farm",
        ),
    )


class MapTile(Base):
    __tablename__ = "map_tile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)
    is_constructible: Mapped[bool] = mapped_column(Boolean, nullable=False)

    __table_args__ = (UniqueConstraint("x", "y", name="uq_tile_coordinates"),)

    village = relationship("Village", back_populates="tile", uselist=False)


class MapTileResourceLayout(Base):
    __tablename__ = "map_tile_resource_layout"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    map_tile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("map_tile.id", ondelete="CASCADE"), nullable=False
    )
    resource_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources_types.id"), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "map_tile_id", "resource_type_id", name="uq_tile_resource"
        ),
    )

    map_tile = relationship("MapTile", backref="resource_layouts")
    resource_type = relationship("ResourcesTypes")


class GranaryCapacity(Base):
    __tablename__ = "granary_capacity"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("level", name="uq_granary_level"),)


class WarehouseCapacity(Base):
    __tablename__ = "warehouse_capacity"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("level", name="uq_warehouse_level"),)


class VillageResourceStorage(Base):
    __tablename__ = "village_resource_storage"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    village_id: Mapped[int] = mapped_column(
        ForeignKey("village.id"), nullable=False
    )
    resource_type_id: Mapped[int] = mapped_column(
        ForeignKey("resources_types.id"), nullable=False
    )

    stored_amount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    last_updated: Mapped[datetime] = mapped_column(nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "village_id", "resource_type_id", name="uq_village_resource"
        ),
    )

    village = relationship("Village", backref="resource_storage")
    resource_type = relationship("ResourcesTypes")


class BuildingType(Base):
    __tablename__ = "building_type"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    # If buildings are tribe-specific, keep this; otherwise make it nullable.
    tribe_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("tribe_attributes.id"), nullable=True
    )
    tribe = relationship("TribeAttributes")

    # If names are global across tribes, set unique on name;
    # if not, make (name, tribe_id) unique together:
    __table_args__ = (
        UniqueConstraint("name", "tribe_id", name="uq_buildingtype_name_tribe"),
    )


class BuildingLevel(Base):
    __tablename__ = "building_level"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("building_type.id"), nullable=False
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    construction_time: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    building_type = relationship("BuildingType", backref="levels")
    population_required: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # one-to-many costs (Wood/Clay/Iron/Crop rows)
    costs = relationship(
        "BuildingUpgradeResource",
        back_populates="building_level",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "building_type_id", "level", name="uq_building_type_level"
        ),
    )


class BuildingPrerequisite(Base):
    __tablename__ = "building_prerequisite"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_level_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("building_level.id", ondelete="CASCADE"),
        nullable=False,
    )
    required_building_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("building_type.id"), nullable=False
    )
    required_level: Mapped[int] = mapped_column(Integer, nullable=False)

    building_level = relationship("BuildingLevel", backref="prerequisites")
    required_building_type = relationship("BuildingType")

    __table_args__ = (
        UniqueConstraint(
            "building_level_id",
            "required_building_type_id",
            name="uq_building_level_requirement",
        ),
    )


class BuildingUpgradeResource(Base):
    __tablename__ = "building_upgrade_resource"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_level_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("building_level.id"), nullable=False, index=True
    )
    resource_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources_types.id"), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    building_level = relationship("BuildingLevel", back_populates="costs")
    resource_type = relationship("ResourcesTypes")

    __table_args__ = (
        UniqueConstraint(
            "building_level_id", "resource_type_id", name="uq_building_upgrade"
        ),
    )