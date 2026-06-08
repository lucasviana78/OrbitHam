"""Authentication routes (register, login, refresh, logout, me)."""
from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.middleware.csrf import get_token
from ninja import Router

from common.envelope import ok
from users.api.auth import cookie_auth
from users.api.cookies import clear_auth_cookies, set_auth_cookies
from users.api.exceptions import NotAuthenticatedException
from users.schemas import LoginIn, RegisterIn, UserOut
from users.services.auth_service import AuthService

router = Router()
_service = AuthService()


@router.post("/register", auth=None)
def register(request: HttpRequest, payload: RegisterIn):
    """Register a new user account."""
    user = _service.register(
        email=payload.email, username=payload.username, password=payload.password
    )
    return ok(UserOut(id=user.id, email=user.email, username=user.username).dict())


@router.post("/login", auth=None)
def login(request: HttpRequest, payload: LoginIn, response: HttpResponse):
    """Authenticate and set HttpOnly auth cookies."""
    user = _service.authenticate(email=payload.email, password=payload.password)
    access, refresh = _service.issue_tokens(user)
    set_auth_cookies(response, access, refresh)
    # Emit the CSRF cookie so the SPA can send X-CSRFToken on mutations
    # (Django Ninja enforces CSRF for cookie-authenticated endpoints).
    get_token(request)
    return ok(UserOut(id=user.id, email=user.email, username=user.username).dict())


@router.post("/refresh", auth=None)
def refresh(request: HttpRequest, response: HttpResponse):
    """Issue a new access cookie using the refresh cookie."""
    refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)
    if not refresh_token:
        raise NotAuthenticatedException()
    access = _service.refresh_access_token(refresh_token)
    set_auth_cookies(response, access)
    return ok({})


@router.post("/logout", auth=None)
def logout(request: HttpRequest, response: HttpResponse):
    """Clear the auth cookies."""
    clear_auth_cookies(response)
    return ok({})


@router.get("/me", auth=cookie_auth)
def me(request: HttpRequest):
    """Return the currently authenticated user."""
    user = request.auth
    # Refresh the CSRF cookie on session bootstrap (dashboard load).
    get_token(request)
    return ok(UserOut(id=user.id, email=user.email, username=user.username).dict())
