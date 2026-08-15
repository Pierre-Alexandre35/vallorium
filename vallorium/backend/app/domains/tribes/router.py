from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domains.tribes.schemas import TribeOut
import app.domains.tribes.services as tribe_service


tribes_router = APIRouter()


@tribes_router.get(
    "/tribes",
    response_model=list[TribeOut],
)
def list_tribes(
    db: Session = Depends(get_db),
) -> list[TribeOut]:
    """
    Get all available tribes.
    """
    return tribe_service.list_tribes(db)
