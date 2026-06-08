"""Service that imports/refreshes satellite TLE data."""
from __future__ import annotations

import logging
from dataclasses import dataclass

import requests
from django.conf import settings

from satellites.models import Satellite
from satellites.repositories.satellite_repository import SatelliteRepository
from satellites.services.fixtures import FALLBACK_TLES

logger = logging.getLogger(__name__)


@dataclass
class ParsedTLE:
    """A single parsed TLE record."""

    norad_id: int
    name: str
    category: str
    tle_1: str
    tle_2: str


class TLEImportService:
    """Fetches TLEs from Celestrak with an offline fixture fallback."""

    def __init__(self, repository: SatelliteRepository | None = None) -> None:
        self.repository = repository or SatelliteRepository()

    def import_satellites(self) -> int:
        """Import/refresh satellites and return the number processed.

        Tries Celestrak first; on any network failure or empty result it
        falls back to the embedded offline fixtures so the system always
        has data. TLE history is recorded whenever a TLE changes.
        """
        records = self._fetch_from_celestrak()
        if not records:
            logger.warning("Celestrak unavailable, using offline fallback fixtures")
            records = self._load_fixtures()

        processed = 0
        for record in records:
            self._upsert(record)
            processed += 1
        return processed

    # ------------------------------------------------------------------
    # Fetching / parsing
    # ------------------------------------------------------------------
    def _fetch_from_celestrak(self) -> list[ParsedTLE]:
        records: list[ParsedTLE] = []
        for url in settings.CELESTRAK_URLS:
            category = "stations" if "stations" in url.lower() else "amateur"
            try:
                resp = requests.get(
                    url, timeout=settings.CELESTRAK_TIMEOUT_SECONDS
                )
                resp.raise_for_status()
            except requests.RequestException as exc:
                logger.warning("Failed to fetch %s: %s", url, exc)
                continue
            records.extend(self._parse_tle_block(resp.text, category))
        return records

    def _load_fixtures(self) -> list[ParsedTLE]:
        return [
            ParsedTLE(
                norad_id=int(item["norad_id"]),
                name=item["name"],
                category=item["category"],
                tle_1=item["tle_1"],
                tle_2=item["tle_2"],
            )
            for item in FALLBACK_TLES
        ]

    @staticmethod
    def _parse_tle_block(text: str, category: str) -> list[ParsedTLE]:
        """Parse a Celestrak 3-line TLE text block."""
        lines = [line.rstrip() for line in text.splitlines() if line.strip()]
        records: list[ParsedTLE] = []
        for i in range(0, len(lines) - 2, 3):
            name = lines[i].strip()
            line1 = lines[i + 1]
            line2 = lines[i + 2]
            if not line1.startswith("1 ") or not line2.startswith("2 "):
                continue
            try:
                norad_id = int(line1[2:7])
            except ValueError:
                continue
            records.append(
                ParsedTLE(
                    norad_id=norad_id,
                    name=name,
                    category=category,
                    tle_1=line1,
                    tle_2=line2,
                )
            )
        return records

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    def _upsert(self, record: ParsedTLE) -> Satellite:
        existing = self.repository.get_by_norad_id(record.norad_id)
        if existing is None:
            satellite = self.repository.create(
                norad_id=record.norad_id,
                name=record.name,
                category=record.category,
                status="active",
                tle_1=record.tle_1,
                tle_2=record.tle_2,
            )
            self.repository.add_history(
                satellite=satellite, tle_1=record.tle_1, tle_2=record.tle_2
            )
            return satellite

        tle_changed = (
            existing.tle_1 != record.tle_1 or existing.tle_2 != record.tle_2
        )
        satellite = self.repository.update(
            existing,
            name=record.name,
            category=record.category,
            tle_1=record.tle_1,
            tle_2=record.tle_2,
        )
        if tle_changed:
            self.repository.add_history(
                satellite=satellite, tle_1=record.tle_1, tle_2=record.tle_2
            )
        return satellite
