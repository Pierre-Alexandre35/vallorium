from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.sessions import SessionUser
from app.db.session import get_db
from app.domains.dashboards.schemas import DashboardCurrentOut
import app.domains.dashboards.service as dashboard_service


dashboard_router = APIRouter()


@dashboard_router.get(
    "/dashboard/current",
    response_model=DashboardCurrentOut,
)
def get_current_dashboard(
    db: Session = Depends(get_db),
    current_user: SessionUser = Depends(get_current_active_user),
) -> DashboardCurrentOut:
    return dashboard_service.get_current_dashboard(db, current_user)
