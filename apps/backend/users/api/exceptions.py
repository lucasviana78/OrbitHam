"""API-layer auth exceptions."""
from __future__ import annotations


class NotAuthenticatedException(Exception):
    """Raised by the cookie auth class when no valid session is present."""

    def __init__(self, message: str = "Não autenticado") -> None:
        super().__init__(message)
