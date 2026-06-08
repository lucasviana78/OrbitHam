"""Celery application configuration for OrbitHam."""
from __future__ import annotations

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "orbitham.settings")

app = Celery("orbitham")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Periodic schedule: re-import TLEs daily at 03:00 UTC.
app.conf.beat_schedule = {
    "update-tle-daily": {
        "task": "satellites.tasks.update_tle_task",
        "schedule": crontab(hour=3, minute=0),
    },
}


@app.task(bind=True)
def debug_task(self) -> None:  # pragma: no cover - utility task
    """Print request info (debug helper)."""
    print(f"Request: {self.request!r}")
