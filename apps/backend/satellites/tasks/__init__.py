"""Satellite Celery tasks."""
from satellites.tasks.update_tle import update_tle_task

__all__ = ["update_tle_task"]
