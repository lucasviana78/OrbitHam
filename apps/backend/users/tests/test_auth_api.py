"""Tests for the authentication API."""
from __future__ import annotations

import pytest
from django.conf import settings

from common.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_register_creates_user(api_client):
    resp = api_client.post(
        "/auth/register",
        json={
            "email": "new@example.com",
            "username": "newuser",
            "password": "password123",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["email"] == "new@example.com"
    assert "id" in body["data"]


def test_register_duplicate_email_conflicts(api_client):
    UserFactory(email="dup@example.com")
    resp = api_client.post(
        "/auth/register",
        json={
            "email": "dup@example.com",
            "username": "other",
            "password": "password123",
        },
    )
    assert resp.status_code == 409
    assert resp.json()["success"] is False


def test_login_sets_cookies_and_returns_user(api_client):
    UserFactory(email="login@example.com", password="password123")
    resp = api_client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "login@example.com"
    cookies = resp._response.cookies
    assert settings.ACCESS_TOKEN_COOKIE in cookies
    assert settings.REFRESH_TOKEN_COOKIE in cookies
    assert cookies[settings.ACCESS_TOKEN_COOKIE]["httponly"]


def test_login_invalid_credentials(api_client):
    UserFactory(email="login2@example.com", password="password123")
    resp = api_client.post(
        "/auth/login",
        json={"email": "login2@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401
    assert resp.json()["success"] is False


def test_me_requires_authentication(api_client):
    resp = api_client.get("/auth/me")
    assert resp.status_code == 401
    assert resp.json() == {"success": False, "message": "Não autenticado"}


def test_me_returns_current_user(api_client, user, auth_cookies):
    resp = api_client.get("/auth/me", COOKIES=auth_cookies)
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == user.email


def test_refresh_issues_new_access_cookie(api_client):
    UserFactory(email="refresh@example.com", password="password123")
    login = api_client.post(
        "/auth/login",
        json={"email": "refresh@example.com", "password": "password123"},
    )
    refresh_cookie = login._response.cookies[settings.REFRESH_TOKEN_COOKIE].value
    resp = api_client.post(
        "/auth/refresh",
        COOKIES={settings.REFRESH_TOKEN_COOKIE: refresh_cookie},
    )
    assert resp.status_code == 200
    assert settings.ACCESS_TOKEN_COOKIE in resp._response.cookies


def test_refresh_without_cookie_unauthorized(api_client):
    resp = api_client.post("/auth/refresh")
    assert resp.status_code == 401


def test_logout_clears_cookies(api_client):
    resp = api_client.post("/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
