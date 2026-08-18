from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.models import User
from app.db.session import get_db
from app.domains.dashboards.schemas import DashboardOverviewOut
import app.domains.dashboards.service as dashboard_service

dashboard_router = APIRouter()


@dashboard_router.get(
    "/dashboard/overview",
    response_model=DashboardOverviewOut,
    response_model_exclude_none=True,
)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return dashboard_service.get_dashboard_overview(db, current_user)
