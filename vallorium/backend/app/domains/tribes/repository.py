from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

import app.db.models as db


def get_all(db_sess: Session) -> list[db.TribeAttributes]:
    stmt = (
        select(db.TribeAttributes)
        .options(
            selectinload(db.TribeAttributes.advantages)
        )
        .order_by(db.TribeAttributes.id)
    )

    return list(db_sess.scalars(stmt).all())


def get_by_id(
    db_sess: Session,
    tribe_id: int,
) -> db.TribeAttributes | None:
    stmt = (
        select(db.TribeAttributes)
        .options(
            selectinload(db.TribeAttributes.advantages)
        )
        .where(db.TribeAttributes.id == tribe_id)
    )

    return db_sess.scalar(stmt)