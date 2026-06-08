"""Tests for the satellites API."""
from __future__ import annotations

import pytest

from common.factories import SatelliteFactory

pytestmark = pytest.mark.django_db


def test_list_requires_auth(api_client):
    resp = api_client.get("/satellites")
    assert resp.status_code == 401


def test_list_satellites(api_client, user, auth_cookies):
    SatelliteFactory(name="ISS (ZARYA)")
    SatelliteFactory(name="AO-7")
    resp = api_client.get("/satellites", COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 2


def test_list_search_filter(api_client, user, auth_cookies):
    SatelliteFactory(name="ISS (ZARYA)")
    SatelliteFactory(name="AO-7 (OSCAR 7)")
    resp = api_client.get("/satellites?search=ISS", COOKIES=auth_cookies)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 1
    assert data[0]["name"] == "ISS (ZARYA)"


def test_list_category_filter(api_client, user, auth_cookies):
    SatelliteFactory(name="ISS (ZARYA)", category="stations")
    SatelliteFactory(name="AO-7", category="amateur")
    resp = api_client.get("/satellites?category=amateur", COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


def test_get_satellite(api_client, user, auth_cookies):
    sat = SatelliteFactory()
    resp = api_client.get(f"/satellites/{sat.id}", COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert resp.json()["data"]["norad_id"] == sat.norad_id


def test_get_satellite_not_found(api_client, user, auth_cookies):
    resp = api_client.get("/satellites/9999", COOKIES=auth_cookies)
    assert resp.status_code == 404


def test_import_endpoint_runs_eagerly(api_client, user, auth_cookies, monkeypatch):
    import requests

    def _boom(*args, **kwargs):
        raise requests.RequestException("no network")

    monkeypatch.setattr(
        "satellites.services.import_service.requests.get", _boom
    )
    resp = api_client.post("/satellites/import", COOKIES=auth_cookies)
    assert resp.status_code == 200
    # Offline fallback imports the fixtures.
    assert resp.json()["data"]["imported"] >= 1
