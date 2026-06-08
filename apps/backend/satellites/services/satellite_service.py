"""Read/query business logic for satellites."""
from __future__ import annotations

from satellites.models import Satellite
from satellites.repositories.satellite_repository import SatelliteRepository
from satellites.services.exceptions import SatelliteNotFoundException


class SatelliteService:
    """Provides satellite lookups for the API and other services."""

    def __init__(self, repository: SatelliteRepository | None = None) -> None:
        self.repository = repository or SatelliteRepository()

    def list(
        self, *, search: str | None = None, category: str | None = None
    ) -> list[Satellite]:
        """Return satellites optionally filtered by search/category."""
        return self.repository.search(search=search, category=category)

    def get_by_id(self, satellite_id: int) -> Satellite:
        """Return a satellite by id or raise ``SatelliteNotFoundException``."""
        satellite = self.repository.get_by_id(satellite_id)
        if satellite is None:
            raise SatelliteNotFoundException()
        return satellite

    def set_frequency(
        self, satellite_id: int, downlink_mhz: float | None
    ) -> Satellite:
        """Set (or clear) a satellite's downlink frequency in MHz.

        Non-positive values are treated as clearing the frequency.
        """
        satellite = self.get_by_id(satellite_id)
        if downlink_mhz is not None and downlink_mhz <= 0:
            downlink_mhz = None
        return self.repository.update(satellite, downlink_mhz=downlink_mhz)

    def list_active(self) -> list[Satellite]:
        """Return all active satellites."""
        return self.repository.list_active()

    def count_active(self) -> int:
        """Return the count of active satellites."""
        return self.repository.count_active()
