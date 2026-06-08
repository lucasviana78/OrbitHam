"""Satellite API schemas."""
from __future__ import annotations

from datetime import datetime

from ninja import Schema


class SatelliteOut(Schema):
    """Output schema for a satellite."""

    id: int
    norad_id: int
    name: str
    category: str
    status: str
    downlink_mhz: float | None = None
    tle_1: str
    tle_2: str
    updated_at: datetime


class SatelliteFrequencyIn(Schema):
    """Input schema to set a satellite's downlink frequency (MHz)."""

    downlink_mhz: float | None = None


class ImportResult(Schema):
    """Result of a TLE import operation."""

    imported: int
