"""Dashboard aggregation business logic."""
from __future__ import annotations

from dataclasses import dataclass

from passes.services.pass_prediction_service import PassWindow
from passes.services.pass_query_service import PassQueryService
from satellites.models import Satellite
from satellites.services.satellite_service import SatelliteService
from stations.repositories.station_repository import StationRepository

MAX_NEXT_PASSES = 20
MAX_ACTIVE_SATELLITES_FOR_PASSES = 5
DEFAULT_PASS_DAYS = 1
MIN_PASS_DAYS = 1
MAX_PASS_DAYS = 10


@dataclass
class DashboardPass:
    """A predicted pass paired with the satellite it belongs to."""

    satellite: Satellite
    window: PassWindow


@dataclass
class DashboardData:
    """Aggregated dashboard payload."""

    active_satellites_count: int
    total_stations: int
    next_passes: list[DashboardPass]
    active_satellites: list[Satellite]


class DashboardService:
    """Builds the dashboard summary for a user."""

    def __init__(
        self,
        satellite_service: SatelliteService | None = None,
        station_repository: StationRepository | None = None,
        pass_query_service: PassQueryService | None = None,
    ) -> None:
        self.satellites = satellite_service or SatelliteService()
        self.station_repo = station_repository or StationRepository()
        self.passes = pass_query_service or PassQueryService()

    def build_for_user(
        self,
        user_id: int,
        station_id: int | None = None,
        days: int = DEFAULT_PASS_DAYS,
    ) -> DashboardData:
        """Assemble dashboard data for the given user.

        ``next_passes`` is empty if the user has no station. It considers the
        station identified by ``station_id`` (when it belongs to the user),
        falling back to the user's first station otherwise. ``days`` bounds the
        prediction window and is clamped to ``[MIN_PASS_DAYS, MAX_PASS_DAYS]``.
        """
        days = max(MIN_PASS_DAYS, min(MAX_PASS_DAYS, days))
        active = self.satellites.list_active()
        total_stations = len(self.station_repo.list_by_user(user_id))

        station = None
        if station_id is not None:
            candidate = self.station_repo.get_by_id(station_id)
            if candidate is not None and candidate.user_id == user_id:
                station = candidate
        if station is None:
            station = self.station_repo.first_by_user(user_id)

        next_passes: list[DashboardPass] = []
        if station is not None:
            for satellite in active[:MAX_ACTIVE_SATELLITES_FOR_PASSES]:
                try:
                    windows = self.passes.passes_for_entities(
                        satellite=satellite, station=station, days=days
                    )
                except Exception:
                    continue
                next_passes.extend(
                    DashboardPass(satellite=satellite, window=w)
                    for w in windows
                )
            next_passes.sort(key=lambda dp: dp.window.rise)
            next_passes = next_passes[:MAX_NEXT_PASSES]

        return DashboardData(
            active_satellites_count=self.satellites.count_active(),
            total_stations=total_stations,
            next_passes=next_passes,
            active_satellites=active,
        )
