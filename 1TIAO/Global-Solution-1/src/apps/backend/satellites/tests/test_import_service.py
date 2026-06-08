"""Tests for the TLE import service (offline fallback + history)."""
from __future__ import annotations

import pytest
import requests

from satellites.models import Satellite, SatelliteTLEHistory
from satellites.services.import_service import TLEImportService

pytestmark = pytest.mark.django_db


@pytest.fixture
def offline(monkeypatch):
    """Force Celestrak fetches to fail so the fallback fixtures are used."""

    def _boom(*args, **kwargs):
        raise requests.RequestException("no network")

    monkeypatch.setattr("satellites.services.import_service.requests.get", _boom)


def test_import_uses_fallback_when_offline(offline):
    count = TLEImportService().import_satellites()
    assert count >= 1
    assert Satellite.objects.filter(norad_id=25544).exists()
    iss = Satellite.objects.get(norad_id=25544)
    assert iss.name == "ISS (ZARYA)"


def test_import_records_history_on_first_insert(offline):
    TLEImportService().import_satellites()
    iss = Satellite.objects.get(norad_id=25544)
    assert SatelliteTLEHistory.objects.filter(satellite=iss).count() == 1


def test_reimport_without_change_adds_no_history(offline):
    service = TLEImportService()
    service.import_satellites()
    service.import_satellites()
    iss = Satellite.objects.get(norad_id=25544)
    assert SatelliteTLEHistory.objects.filter(satellite=iss).count() == 1


def test_reimport_with_changed_tle_adds_history(offline):
    service = TLEImportService()
    service.import_satellites()
    iss = Satellite.objects.get(norad_id=25544)
    iss.tle_1 = "1 25544U 98067A   24300.00000000  .00000000  00000+0  00000-0 0  9990"
    iss.save()
    service.import_satellites()
    assert SatelliteTLEHistory.objects.filter(satellite=iss).count() == 2


def test_parse_tle_block():
    text = (
        "ISS (ZARYA)\n"
        "1 25544U 98067A   24299.51782528  .00016717  00000+0  30200-3 0  9993\n"
        "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50125391473425\n"
    )
    records = TLEImportService._parse_tle_block(text, "stations")
    assert len(records) == 1
    assert records[0].norad_id == 25544
    assert records[0].name == "ISS (ZARYA)"
