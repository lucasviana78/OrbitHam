"""Dashboard aggregation business logic."""
from __future__ import annotations

from dataclasses import dataclass

from passes.services.pass_prediction_service import PassWindow
from passes.services.pass_query_service import PassQueryService
from satellites.models import Satellite
from satellites.services.satellite_service import SatelliteService
from stations.repositories.station_repository import StationRepository

MAX_NEXT_PASSES = 5
MAX_ACTIVE_SATELLITES_FOR_PASSES = 5


@dataclass
class DashboardData:
    """Aggregated dashboard payload."""

    active_satellites_count: int
    total_stations: int
    next_passes: list[PassWindow]
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

    def build_for_user(self, user_id: int) -> DashboardData:
        """Assemble dashboard data for the given user.

        ``next_passes`` is empty if the user has no station. It considers the
        user's first station and the active satellites.
        """
        active = self.satellites.list_active()
        total_stations = len(self.station_repo.list_by_user(user_id))
        station = self.station_repo.first_by_user(user_id)

        next_passes: list[PassWindow] = []
        if station is not None:
            for satellite in active[:MAX_ACTIVE_SATELLITES_FOR_PASSES]:
                try:
                    windows = self.passes.passes_for_entities(
                        satellite=satellite, station=station, days=3
                    )
                except Exception:
                    continue
                next_passes.extend(windows)
            next_passes.sort(key=lambda p: p.rise)
            next_passes = next_passes[:MAX_NEXT_PASSES]

        return DashboardData(
            active_satellites_count=self.satellites.count_active(),
            total_stations=total_stations,
            next_passes=next_passes,
            active_satellites=active,
        )
