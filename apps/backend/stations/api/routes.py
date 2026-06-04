"""Station CRUD routes (owner-scoped)."""
from __future__ import annotations

from django.http import HttpRequest
from ninja import Router

from common.envelope import ok
from stations.models import Station
from stations.schemas import StationIn, StationOut
from stations.services.station_service import StationService
from users.api.auth import cookie_auth

router = Router(auth=cookie_auth)
_service = StationService()


def _serialize(station: Station) -> dict:
    return StationOut(
        id=station.id,
        user_id=station.user_id,
        name=station.name,
        latitude=station.latitude,
        longitude=station.longitude,
        altitude=station.altitude,
        callsign=station.callsign,
    ).dict()


@router.get("")
def list_stations(request: HttpRequest):
    """List the authenticated user's stations."""
    stations = _service.list_for_user(request.auth.id)
    return ok([_serialize(s) for s in stations])


@router.post("")
def create_station(request: HttpRequest, payload: StationIn):
    """Create a station for the authenticated user."""
    station = _service.create(user_id=request.auth.id, **payload.dict())
    return ok(_serialize(station))


@router.get("/{int:station_id}")
def get_station(request: HttpRequest, station_id: int):
    """Retrieve one station owned by the user."""
    station = _service.get_owned(station_id=station_id, user_id=request.auth.id)
    return ok(_serialize(station))


@router.put("/{int:station_id}")
def update_station(request: HttpRequest, station_id: int, payload: StationIn):
    """Update a station owned by the user."""
    station = _service.update(
        station_id=station_id, user_id=request.auth.id, **payload.dict()
    )
    return ok(_serialize(station))


@router.delete("/{int:station_id}")
def delete_station(request: HttpRequest, station_id: int):
    """Delete a station owned by the user."""
    _service.delete(station_id=station_id, user_id=request.auth.id)
    return ok({})
