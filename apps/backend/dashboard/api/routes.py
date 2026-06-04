"""Dashboard route."""
from __future__ import annotations

from django.http import HttpRequest
from ninja import Router

from common.envelope import ok
from dashboard.services.dashboard_service import DashboardService
from passes.api.routes import serialize_pass
from satellites.api.routes import serialize_satellite
from users.api.auth import cookie_auth

router = Router(auth=cookie_auth)
_service = DashboardService()


@router.get("")
def get_dashboard(request: HttpRequest):
    """Return aggregated dashboard data for the authenticated user."""
    data = _service.build_for_user(request.auth.id)
    return ok(
        {
            "active_satellites_count": data.active_satellites_count,
            "total_stations": data.total_stations,
            "next_passes": [serialize_pass(p) for p in data.next_passes],
            "active_satellites": [
                serialize_satellite(s) for s in data.active_satellites
            ],
        }
    )
