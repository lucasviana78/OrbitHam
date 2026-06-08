"""Repository for Satellite persistence (CRUD only)."""
from __future__ import annotations

from django.db.models import Q

from satellites.models import Satellite, SatelliteTLEHistory


class SatelliteRepository:
    """Data-access layer for satellites and their TLE history."""

    def get_by_id(self, satellite_id: int) -> Satellite | None:
        """Return a satellite by id or ``None``."""
        return Satellite.objects.filter(id=satellite_id).first()

    def get_by_norad_id(self, norad_id: int) -> Satellite | None:
        """Return a satellite by NORAD id or ``None``."""
        return Satellite.objects.filter(norad_id=norad_id).first()

    def search(
        self, *, search: str | None = None, category: str | None = None
    ) -> list[Satellite]:
        """Return satellites filtered by free-text search and/or category."""
        qs = Satellite.objects.all()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(norad_id__icontains=search))
        if category:
            qs = qs.filter(category__iexact=category)
        return list(qs.order_by("name"))

    def list_active(self) -> list[Satellite]:
        """Return all active satellites."""
        return list(Satellite.objects.filter(status="active").order_by("name"))

    def count_active(self) -> int:
        """Return the number of active satellites."""
        return Satellite.objects.filter(status="active").count()

    def create(self, **fields) -> Satellite:
        """Create a new satellite."""
        return Satellite.objects.create(**fields)

    def update(self, satellite: Satellite, **fields) -> Satellite:
        """Update and persist a satellite instance."""
        for key, value in fields.items():
            setattr(satellite, key, value)
        satellite.save()
        return satellite

    def add_history(
        self, *, satellite: Satellite, tle_1: str, tle_2: str
    ) -> SatelliteTLEHistory:
        """Append a TLE history record for the satellite."""
        return SatelliteTLEHistory.objects.create(
            satellite=satellite, tle_1=tle_1, tle_2=tle_2
        )
