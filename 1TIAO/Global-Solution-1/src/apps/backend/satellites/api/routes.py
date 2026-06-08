"""Satellite read + import routes."""
from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest
from ninja import Query, Router

from common.envelope import ok
from satellites.models import Satellite
from satellites.schemas import SatelliteFrequencyIn, SatelliteOut
from satellites.services.satellite_service import SatelliteService
from satellites.tasks import update_tle_task
from users.api.auth import cookie_auth

router = Router(auth=cookie_auth)
_service = SatelliteService()


def serialize_satellite(satellite: Satellite) -> dict:
    return SatelliteOut(
        id=satellite.id,
        norad_id=satellite.norad_id,
        name=satellite.name,
        category=satellite.category,
        status=satellite.status,
        downlink_mhz=satellite.downlink_mhz,
        tle_1=satellite.tle_1,
        tle_2=satellite.tle_2,
        updated_at=satellite.updated_at,
    ).dict()


@router.get("")
def list_satellites(
    request: HttpRequest,
    search: str | None = Query(None),
    category: str | None = Query(None),
):
    """List satellites, optionally filtered by search/category."""
    satellites = _service.list(search=search, category=category)
    return ok([serialize_satellite(s) for s in satellites])


@router.get("/{int:satellite_id}")
def get_satellite(request: HttpRequest, satellite_id: int):
    """Retrieve a single satellite by id."""
    return ok(serialize_satellite(_service.get_by_id(satellite_id)))


@router.patch("/{int:satellite_id}/frequency")
def set_satellite_frequency(
    request: HttpRequest, satellite_id: int, payload: SatelliteFrequencyIn
):
    """Set (or clear) a satellite's downlink frequency in MHz."""
    satellite = _service.set_frequency(satellite_id, payload.downlink_mhz)
    return ok(serialize_satellite(satellite))


@router.post("/import")
def import_satellites(request: HttpRequest):
    """Trigger an asynchronous TLE import (runs eagerly in tests)."""
    result = update_tle_task.delay()
    imported = 0
    # Only block for the result when running eagerly (tests/dev without broker).
    if settings.CELERY_TASK_ALWAYS_EAGER:
        try:
            imported = int(result.get())
        except Exception:
            imported = 0
    return ok({"imported": imported})
