"""Helpers to set and clear auth cookies on responses."""
from __future__ import annotations

from django.conf import settings
from django.http import HttpResponse


def set_auth_cookies(
    response: HttpResponse, access_token: str, refresh_token: str | None = None
) -> None:
    """Attach HttpOnly access (and optionally refresh) cookies to the response."""
    common = {
        "httponly": True,
        "secure": settings.COOKIE_SECURE,
        "samesite": settings.COOKIE_SAMESITE,
        "path": "/",
    }
    response.set_cookie(
        settings.ACCESS_TOKEN_COOKIE,
        access_token,
        max_age=settings.JWT_ACCESS_TOKEN_LIFETIME_MINUTES * 60,
        **common,
    )
    if refresh_token is not None:
        response.set_cookie(
            settings.REFRESH_TOKEN_COOKIE,
            refresh_token,
            max_age=settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS * 24 * 3600,
            **common,
        )


def clear_auth_cookies(response: HttpResponse) -> None:
    """Remove the auth cookies from the client."""
    response.delete_cookie(settings.ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(settings.REFRESH_TOKEN_COOKIE, path="/")
