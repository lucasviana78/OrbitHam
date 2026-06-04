"""Pass-prediction routes."""
from __future__ import annotations

from datetime import UTC, datetime

from django.http import HttpRequest
from ninja import Query, Router

from common.envelope import ok
from passes.services.pass_prediction_service import PassWindow
from passes.services.pass_query_service import PassQueryService
from users.api.auth import cookie_auth

router = Router(auth=cookie_auth)
_service = PassQueryService()


def _iso_z(dt: datetime) -> str:
    """Format a datetime as ISO-8601 UTC with a trailing ``Z``."""
    dt = dt.astimezone(UTC).replace(microsecond=0)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def serialize_pass(window: PassWindow) -> dict:
    """Serialize a ``PassWindow`` to the contract's JSON shape."""
    return {
        "rise": _iso_z(window.rise),
        "peak": _iso_z(window.peak),
        "set": _iso_z(window.set),
        "max_elevation": window.max_elevation,
    }


@router.get("")
def list_passes(
    request: HttpRequest,
    satellite_id: int = Query(...),
    station_id: int = Query(...),
    days: int = Query(3, ge=1, le=10),
):
    """Compute upcoming passes for a satellite over a station."""
    windows = _service.passes_for(
        user_id=request.auth.id,
        satellite_id=satellite_id,
        station_id=station_id,
        days=days,
    )
    return ok([serialize_pass(w) for w in windows])
