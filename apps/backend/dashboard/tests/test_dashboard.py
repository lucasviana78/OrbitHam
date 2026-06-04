"""Tests for the dashboard API."""
from __future__ import annotations

import pytest

from common.factories import SatelliteFactory, StationFactory

pytestmark = pytest.mark.django_db


def test_dashboard_requires_auth(api_client):
    resp = api_client.get("/dashboard")
    assert resp.status_code == 401


def test_dashboard_without_station_has_empty_passes(api_client, user, auth_cookies):
    SatelliteFactory()
    resp = api_client.get("/dashboard", COOKIES=auth_cookies)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["active_satellites_count"] == 1
    assert data["total_stations"] == 0
    assert data["next_passes"] == []
    assert len(data["active_satellites"]) == 1


def test_dashboard_counts_active_only(api_client, user, auth_cookies):
    SatelliteFactory(status="active")
    SatelliteFactory(status="decayed")
    resp = api_client.get("/dashboard", COOKIES=auth_cookies)
    data = resp.json()["data"]
    assert data["active_satellites_count"] == 1


def test_dashboard_with_station_returns_shape(api_client, user, auth_cookies):
    StationFactory(user=user)
    SatelliteFactory()
    resp = api_client.get("/dashboard", COOKIES=auth_cookies)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_stations"] == 1
    assert isinstance(data["next_passes"], list)
