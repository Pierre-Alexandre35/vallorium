from sqlalchemy.orm import Session
import app.db.models as db


def get_by_id(db_sess: Session, tribe_id: int) -> db.TribeAttributes | None:
    return db_sess.query(db.TribeAttributes).filter_by(id=tribe_id).first()
