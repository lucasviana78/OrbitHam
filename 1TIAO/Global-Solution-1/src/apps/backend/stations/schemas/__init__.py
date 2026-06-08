"""Station API schemas."""
from __future__ import annotations

from ninja import Schema
from pydantic import Field


class StationIn(Schema):
    """Input schema for creating/updating a station."""

    name: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitude: float = 0.0
    callsign: str = Field(min_length=1, max_length=20)


class StationOut(Schema):
    """Output schema for a station."""

    id: int
    user_id: int
    name: str
    latitude: float
    longitude: float
    altitude: float
    callsign: str
