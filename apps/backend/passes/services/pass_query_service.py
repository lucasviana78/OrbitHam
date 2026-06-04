"""Orchestrates station/satellite lookup and pass prediction."""
from __future__ import annotations

from datetime import datetime

from passes.services.pass_prediction_service import (
    PassPredictionService,
    PassWindow,
)
from satellites.models import Satellite
from satellites.services.satellite_service import SatelliteService
from stations.models import Station
from stations.services.station_service import StationService


class PassQueryService:
    """Resolves entities and delegates to :class:`PassPredictionService`."""

    def __init__(
        self,
        station_service: StationService | None = None,
        satellite_service: SatelliteService | None = None,
        prediction_service: PassPredictionService | None = None,
    ) -> None:
        self.stations = station_service or StationService()
        self.satellites = satellite_service or SatelliteService()
        self.prediction = prediction_service or PassPredictionService()

    def passes_for(
        self,
        *,
        user_id: int,
        satellite_id: int,
        station_id: int,
        days: int = 3,
        start: datetime | None = None,
    ) -> list[PassWindow]:
        """Return passes for a user-owned station and a satellite by id."""
        station = self.stations.get_owned(station_id=station_id, user_id=user_id)
        satellite = self.satellites.get_by_id(satellite_id)
        return self._predict(satellite, station, days=days, start=start)

    def passes_for_entities(
        self,
        *,
        satellite: Satellite,
        station: Station,
        days: int = 3,
        start: datetime | None = None,
    ) -> list[PassWindow]:
        """Return passes given already-resolved satellite/station instances."""
        return self._predict(satellite, station, days=days, start=start)

    def _predict(
        self,
        satellite: Satellite,
        station: Station,
        *,
        days: int,
        start: datetime | None,
    ) -> list[PassWindow]:
        return self.prediction.calculate_passes(
            tle_1=satellite.tle_1,
            tle_2=satellite.tle_2,
            latitude=station.latitude,
            longitude=station.longitude,
            altitude_m=station.altitude,
            days=days,
            name=satellite.name,
            start=start,
        )
