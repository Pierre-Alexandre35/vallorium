import logging

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
import app.domains.villages.service as village_service


logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.complete_due_farm_upgrades",
    acks_late=True,
    ignore_result=True,
)
def complete_due_farm_upgrades() -> None:
    """Materialize farm upgrades whose game completion time has passed."""
    db = SessionLocal()

    try:
        completed = village_service.complete_due_farm_upgrades(
            db,
            batch_size=100,
        )

        if completed:
            logger.info("Completed %s due farm upgrades", completed)
    finally:
        db.close()


@celery_app.task(acks_late=True)
def example_task(word: str) -> str:
    return f"test task returns {word}"
