"""Tests for the seed_demo management command."""
from __future__ import annotations

import pytest
import requests
from django.conf import settings
from django.core.management import call_command

from stations.models import Station
from users.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    """Force satellite import to use the offline fallback."""

    def _boom(*args, **kwargs):
        raise requests.RequestException("no network")

    monkeypatch.setattr("satellites.services.import_service.requests.get", _boom)


def test_seed_demo_is_idempotent():
    call_command("seed_demo")
    call_command("seed_demo")
    assert User.objects.filter(email=settings.DEMO_USER_EMAIL).count() == 1
    user = User.objects.get(email=settings.DEMO_USER_EMAIL)
    assert Station.objects.filter(user=user, callsign="PU2DEMO").count() == 1


def test_seed_demo_creates_login_able_user():
    call_command("seed_demo")
    user = User.objects.get(email=settings.DEMO_USER_EMAIL)
    assert user.check_password(settings.DEMO_USER_PASSWORD)
