"""Pytest fixtures shared across the backend test suite."""
from __future__ import annotations

import os

os.environ.setdefault("DJANGO_TEST", "1")

import pytest  # noqa: E402
from ninja.testing import TestClient  # noqa: E402


@pytest.fixture
def api_client():
    """Return a Ninja TestClient bound to the project API."""
    from orbitham.api import api

    return TestClient(api)


@pytest.fixture
def user(db):
    """Create and return a persisted test user."""
    from users.models import User

    return User.objects.create_user(
        email="user@example.com", username="tester", password="password123"
    )


@pytest.fixture
def auth_cookies(user):
    """Return a ``COOKIES`` dict carrying a valid access token for ``user``."""
    from django.conf import settings

    from users.services.jwt_service import JWTService

    token = JWTService().create_access_token(user.id)
    return {settings.ACCESS_TOKEN_COOKIE: token}
