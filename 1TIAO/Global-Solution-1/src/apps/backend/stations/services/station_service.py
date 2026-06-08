"""Business logic for stations."""
from __future__ import annotations

from stations.models import Station
from stations.repositories.station_repository import StationRepository
from stations.services.exceptions import (
    InvalidCoordinatesException,
    StationNotFoundException,
    StationPermissionException,
)


class StationService:
    """Manages CRUD operations on stations scoped to their owner."""

    def __init__(self, repository: StationRepository | None = None) -> None:
        self.repository = repository or StationRepository()

    def list_for_user(self, user_id: int) -> list[Station]:
        """Return all stations belonging to a user."""
        return self.repository.list_by_user(user_id)

    def get_owned(self, *, station_id: int, user_id: int) -> Station:
        """Return a station ensuring the requesting user owns it.

        Raises ``StationNotFoundException`` or ``StationPermissionException``.
        """
        station = self.repository.get_by_id(station_id)
        if station is None:
            raise StationNotFoundException()
        if station.user_id != user_id:
            raise StationPermissionException()
        return station

    def create(
        self,
        *,
        user_id: int,
        name: str,
        latitude: float,
        longitude: float,
        altitude: float,
        callsign: str,
    ) -> Station:
        """Create a station for the user after validating coordinates."""
        self._validate_coordinates(latitude, longitude)
        return self.repository.create(
            user_id=user_id,
            name=name,
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            callsign=callsign,
        )

    def update(
        self,
        *,
        station_id: int,
        user_id: int,
        name: str,
        latitude: float,
        longitude: float,
        altitude: float,
        callsign: str,
    ) -> Station:
        """Update a user-owned station after validating coordinates."""
        station = self.get_owned(station_id=station_id, user_id=user_id)
        self._validate_coordinates(latitude, longitude)
        return self.repository.update(
            station,
            name=name,
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            callsign=callsign,
        )

    def delete(self, *, station_id: int, user_id: int) -> None:
        """Delete a user-owned station."""
        station = self.get_owned(station_id=station_id, user_id=user_id)
        self.repository.delete(station)

    @staticmethod
    def _validate_coordinates(latitude: float, longitude: float) -> None:
        if not -90.0 <= latitude <= 90.0:
            raise InvalidCoordinatesException("Latitude deve estar entre -90 e 90")
        if not -180.0 <= longitude <= 180.0:
            raise InvalidCoordinatesException("Longitude deve estar entre -180 e 180")
