"""Tests for the stations CRUD API."""
from __future__ import annotations

import pytest

from common.factories import StationFactory, UserFactory

pytestmark = pytest.mark.django_db


def _payload(**overrides) -> dict:
    data = {
        "name": "Home",
        "latitude": -23.5,
        "longitude": -46.6,
        "altitude": 700.0,
        "callsign": "PU2ABC",
    }
    data.update(overrides)
    return data


def test_list_requires_auth(api_client):
    resp = api_client.get("/stations")
    assert resp.status_code == 401


def test_create_and_list_station(api_client, user, auth_cookies):
    resp = api_client.post("/stations", json=_payload(), COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert resp.json()["data"]["callsign"] == "PU2ABC"
    assert resp.json()["data"]["user_id"] == user.id

    listing = api_client.get("/stations", COOKIES=auth_cookies)
    assert listing.status_code == 200
    assert len(listing.json()["data"]) == 1


def test_get_station(api_client, user, auth_cookies):
    station = StationFactory(user=user)
    resp = api_client.get(f"/stations/{station.id}", COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == station.id


def test_get_station_not_found(api_client, user, auth_cookies):
    resp = api_client.get("/stations/9999", COOKIES=auth_cookies)
    assert resp.status_code == 404
    assert resp.json()["success"] is False


def test_cannot_access_other_users_station(api_client, user, auth_cookies):
    other = UserFactory()
    station = StationFactory(user=other)
    resp = api_client.get(f"/stations/{station.id}", COOKIES=auth_cookies)
    assert resp.status_code == 403


def test_update_station(api_client, user, auth_cookies):
    station = StationFactory(user=user)
    resp = api_client.put(
        f"/stations/{station.id}",
        json=_payload(name="Updated", callsign="PU2XYZ"),
        COOKIES=auth_cookies,
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["name"] == "Updated"


def test_delete_station(api_client, user, auth_cookies):
    station = StationFactory(user=user)
    resp = api_client.delete(f"/stations/{station.id}", COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert resp.json()["data"] == {}
    follow = api_client.get(f"/stations/{station.id}", COOKIES=auth_cookies)
    assert follow.status_code == 404


def test_create_invalid_latitude_rejected(api_client, user, auth_cookies):
    resp = api_client.post(
        "/stations", json=_payload(latitude=200), COOKIES=auth_cookies
    )
    assert resp.status_code == 422
    assert resp.json()["success"] is False
