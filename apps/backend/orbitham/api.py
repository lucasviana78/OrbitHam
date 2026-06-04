"""Root NinjaAPI instance and global exception handling.

Mounts all module routers under the ``/api`` prefix and normalises errors
into the standard response envelope ``{"success": false, "message": ...}``.
"""
from __future__ import annotations

from ninja import NinjaAPI
from ninja.errors import AuthenticationError, ValidationError

from satellites.services.exceptions import SatelliteNotFoundException
from stations.services.exceptions import (
    InvalidCoordinatesException,
    StationNotFoundException,
    StationPermissionException,
)
from users.api.exceptions import NotAuthenticatedException
from users.services.exceptions import (
    AuthenticationFailedException,
    EmailAlreadyExistsException,
    InvalidTokenException,
    UsernameAlreadyExistsException,
    UserNotFoundException,
)

api = NinjaAPI(title="OrbitHam API", version="1.0.0")


@api.exception_handler(NotAuthenticatedException)
def not_authenticated_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": "Não autenticado"}, status=401
    )


@api.exception_handler(AuthenticationError)
def ninja_auth_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": "Não autenticado"}, status=401
    )


@api.exception_handler(AuthenticationFailedException)
def auth_failed_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=401
    )


@api.exception_handler(InvalidTokenException)
def invalid_token_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=401
    )


@api.exception_handler(EmailAlreadyExistsException)
def email_exists_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=409
    )


@api.exception_handler(UsernameAlreadyExistsException)
def username_exists_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=409
    )


@api.exception_handler(UserNotFoundException)
def user_not_found_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=404
    )


@api.exception_handler(StationNotFoundException)
def station_not_found_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=404
    )


@api.exception_handler(StationPermissionException)
def station_permission_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=403
    )


@api.exception_handler(InvalidCoordinatesException)
def invalid_coordinates_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=422
    )


@api.exception_handler(SatelliteNotFoundException)
def satellite_not_found_handler(request, exc):
    return api.create_response(
        request, {"success": False, "message": str(exc)}, status=404
    )


@api.exception_handler(ValidationError)
def validation_handler(request, exc):
    """Normalise Ninja 422 validation errors into the envelope."""
    errors = exc.errors
    try:
        first = errors[0]
        loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
        message = f"{loc}: {first.get('msg')}" if loc else first.get("msg", "Validation error")
    except Exception:  # pragma: no cover
        message = "Validation error"
    return api.create_response(
        request, {"success": False, "message": message}, status=422
    )


def register_routers() -> None:
    """Attach all module routers to the API instance."""
    from dashboard.api.routes import router as dashboard_router
    from passes.api.routes import router as passes_router
    from satellites.api.routes import router as satellites_router
    from stations.api.routes import router as stations_router
    from users.api.routes import router as users_router

    api.add_router("/auth", users_router, tags=["auth"])
    api.add_router("/stations", stations_router, tags=["stations"])
    api.add_router("/satellites", satellites_router, tags=["satellites"])
    api.add_router("/passes", passes_router, tags=["passes"])
    api.add_router("/dashboard", dashboard_router, tags=["dashboard"])


register_routers()
