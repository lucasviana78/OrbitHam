"""Repository for Station persistence (CRUD only)."""
from __future__ import annotations

from stations.models import Station


class StationRepository:
    """Data-access layer for the Station model."""

    def get_by_id(self, station_id: int) -> Station | None:
        """Return a station by id or ``None``."""
        return Station.objects.filter(id=station_id).first()

    def list_by_user(self, user_id: int) -> list[Station]:
        """Return all stations owned by a user."""
        return list(Station.objects.filter(user_id=user_id).order_by("id"))

    def first_by_user(self, user_id: int) -> Station | None:
        """Return the first station owned by a user, or ``None``."""
        return Station.objects.filter(user_id=user_id).order_by("id").first()

    def create(self, *, user_id: int, **fields) -> Station:
        """Create a new station for the given user."""
        return Station.objects.create(user_id=user_id, **fields)

    def update(self, station: Station, **fields) -> Station:
        """Update and persist the given station instance."""
        for key, value in fields.items():
            setattr(station, key, value)
        station.save()
        return station

    def delete(self, station: Station) -> None:
        """Delete the given station."""
        station.delete()
