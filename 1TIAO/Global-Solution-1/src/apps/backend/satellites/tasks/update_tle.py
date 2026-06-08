"""Periodic Celery task that re-imports satellite TLEs."""
from __future__ import annotations

import logging

from celery import shared_task

from satellites.services.import_service import TLEImportService

logger = logging.getLogger(__name__)


@shared_task(name="satellites.tasks.update_tle_task")
def update_tle_task() -> int:
    """Re-import satellite TLEs and return the number processed."""
    count = TLEImportService().import_satellites()
    logger.info("update_tle_task processed %s satellites", count)
    return count
