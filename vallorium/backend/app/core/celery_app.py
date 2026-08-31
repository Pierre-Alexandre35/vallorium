import os

from celery import Celery


broker_url = os.getenv(
    "CELERY_BROKER_URL",
    os.getenv("REDIS_URL", "redis://redis:6379/0"),
)

celery_app = Celery(
    "vallorium",
    broker=broker_url,
    include=["app.tasks"],
)

celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.*": "main-queue",
    },
    beat_schedule={
        "complete-due-farm-upgrades": {
            "task": "app.tasks.complete_due_farm_upgrades",
            "schedule": 2.0,
            # If the worker is temporarily backed up, stale sweep messages are
            # not useful: a newer sweep will cover the same DB-backed work.
            "options": {
                "expires": 10.0,
                "queue": "main-queue",
            },
        },
    },
)
