"""Django Ninja authentication class reading the access token cookie."""
from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest
from ninja.security import APIKeyCookie

from users.api.exceptions import NotAuthenticatedException
from users.models import User
from users.services.auth_service import AuthService
from users.services.exceptions import InvalidTokenException


class CookieJWTAuth(APIKeyCookie):
    """Authenticate a request from the HttpOnly access-token cookie."""

    param_name = settings.ACCESS_TOKEN_COOKIE

    def __init__(self, auth_service: AuthService | None = None) -> None:
        super().__init__()
        self._service = auth_service or AuthService()

    def authenticate(self, request: HttpRequest, key: str | None) -> User:
        """Return the authenticated user or raise ``NotAuthenticatedException``."""
        if not key:
            raise NotAuthenticatedException()
        try:
            user = self._service.get_user_from_access_token(key)
        except InvalidTokenException as exc:
            raise NotAuthenticatedException() from exc
        request.user = user
        return user


cookie_auth = CookieJWTAuth()
