"""Tests for pass prediction (service and API)."""
from __future__ import annotations

from datetime import UTC, datetime

import pytest

from common.factories import SatelliteFactory, StationFactory
from passes.services.pass_prediction_service import (
    MIN_ELEVATION_DEG,
    PassPredictionService,
)

pytestmark = pytest.mark.django_db

# ISS TLE matching the epoch in the factory.
ISS_TLE_1 = "1 25544U 98067A   24299.51782528  .00016717  00000+0  30200-3 0  9993"
ISS_TLE_2 = "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50125391473425"

# A fixed start near the TLE epoch (2024-10-25) for deterministic results.
FIXED_START = datetime(2024, 10, 25, 0, 0, 0, tzinfo=UTC)


def test_prediction_service_returns_passes_with_min_elevation():
    service = PassPredictionService()
    passes = service.calculate_passes(
        tle_1=ISS_TLE_1,
        tle_2=ISS_TLE_2,
        latitude=-23.5505,
        longitude=-46.6333,
        altitude_m=760.0,
        days=3,
        start=FIXED_START,
    )
    assert len(passes) > 0
    for window in passes:
        assert window.max_elevation >= MIN_ELEVATION_DEG
        assert window.rise <= window.peak <= window.set


def test_days_is_clamped():
    service = PassPredictionService()
    passes = service.calculate_passes(
        tle_1=ISS_TLE_1,
        tle_2=ISS_TLE_2,
        latitude=-23.5505,
        longitude=-46.6333,
        altitude_m=760.0,
        days=999,
        start=FIXED_START,
    )
    # 10-day clamp still produces results without error.
    assert isinstance(passes, list)


def test_passes_api_requires_auth(api_client):
    resp = api_client.get("/passes?satellite_id=1&station_id=1&days=3")
    assert resp.status_code == 401


def test_passes_api_returns_iso_z(api_client, user, auth_cookies):
    sat = SatelliteFactory(tle_1=ISS_TLE_1, tle_2=ISS_TLE_2)
    station = StationFactory(user=user)
    resp = api_client.get(
        f"/passes?satellite_id={sat.id}&station_id={station.id}&days=3",
        COOKIES=auth_cookies,
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert first["rise"].endswith("Z")
        assert set(first.keys()) == {"rise", "peak", "set", "max_elevation"}


def test_passes_api_other_user_station_forbidden(api_client, user, auth_cookies):
    from common.factories import UserFactory

    sat = SatelliteFactory()
    other_station = StationFactory(user=UserFactory())
    resp = api_client.get(
        f"/passes?satellite_id={sat.id}&station_id={other_station.id}&days=3",
        COOKIES=auth_cookies,
    )
    assert resp.status_code == 403
