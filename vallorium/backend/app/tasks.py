import logging
from datetime import datetime, timezone
from time import monotonic

import app.domains.villages.repository as village_repo
import app.domains.villages.service as village_service
from app.core.celery_app import celery_app
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.complete_due_farm_upgrades",
    acks_late=True,
    ignore_result=True,
)
def complete_due_farm_upgrades() -> None:
    """Materialize farm upgrades whose game completion time has passed."""
    started = monotonic()
    db = SessionLocal()

    try:
        completed = village_service.complete_due_farm_upgrades(
            db,
            batch_size=100,
        )

        now = datetime.now(timezone.utc)
        pending, oldest = village_repo.get_farm_upgrade_backlog(db, now=now)
        lag = max(0.0, (now - oldest).total_seconds()) if oldest else 0.0
        log = logger.warning if pending else logger.info
        log(
            "Farm upgrade sweep completed=%s pending=%s oldest_due_seconds=%.3f duration_seconds=%.3f",
            completed,
            pending,
            lag,
            monotonic() - started,
        )
    finally:
        db.close()


@celery_app.task(acks_late=True)
def example_task(word: str) -> str:
    return f"test task returns {word}"
