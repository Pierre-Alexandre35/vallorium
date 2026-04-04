# app/services/tribe_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import app.domains.tribes.repository as tribe_repo


def get_tribe_by_id(db_sess: Session, tribe_id: int):
    tribe = tribe_repo.get_by_id(db_sess, tribe_id)
    if not tribe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tribe not found"
        )
    return tribe
