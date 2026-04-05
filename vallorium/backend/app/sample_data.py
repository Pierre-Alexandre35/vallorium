# seed.py
from faker import Faker

from vallorium.backend.old_backend.app.db.session import SessionLocal
from vallorium.backend.old_backend.app.services.user_service import create_user
from vallorium.backend.old_backend.app.services.village_service import (
    create_village,
)


# ORM models & enums (aliased as `db` to prevent name collisions)
import vallorium.backend.old_backend.app.db.models as db

# Pydantic DTOs
from vallorium.backend.old_backend.app.schemas.user import UserCreate
from vallorium.backend.old_backend.app.schemas.village import VillageCreate


fake = Faker()


def insert_fake_users_and_villages(db_sess, count: int = 3) -> None:
    """
    Create `count` users and villages on free map tiles.
    - Chooses the Romans tribe for all created users.
    - Uses Faker for random emails/cities/populations.
    """

    # Find the Romans tribe (db.Tribe is your SQLAlchemy Enum)
    romans = (
        db_sess.query(db.TribeAttributes)
        .filter_by(name=db.Tribe.ROMANS.value)
        .first()
    )
    if not romans:
        raise ValueError("Romans tribe not found! Seed your tribes first.")

    # Grab `count` free tiles (no village assigned)
    free_tiles = (
        db_sess.query(db.MapTile)
        .outerjoin(db.Village, db.MapTile.id == db.Village.map_tile_id)
        .filter(db.Village.id.is_(None))
        .limit(count)
        .all()
    )

    if not free_tiles:
        print("ℹ️  No free tiles available.")
        return

    created = 0
    for tile in free_tiles:
        # Create user
        user = create_user(
            db_sess,
            UserCreate(
                email=fake.unique.email(),
                password=fake.password(length=12),
                is_active=True,
                is_superuser=fake.boolean(chance_of_getting_true=10),
                tribe_id=romans.id,
            ),
        )

        # Create village for that user on this free tile
        create_village(
            db_sess,
            VillageCreate(
                name=fake.city(),
                map_tile_id=tile.id,
                population=fake.random_int(min=50, max=500),
            ),
            owner_id=user.id,
        )

        created += 1

    print(f"✅ {created} village(s) created.")


if __name__ == "__main__":
    db_sess = SessionLocal()
    try:
        insert_fake_users_and_villages(db_sess, count=3)
    finally:
        db_sess.close()
