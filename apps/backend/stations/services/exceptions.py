"""Custom exceptions for the stations module."""
from __future__ import annotations


class StationNotFoundException(Exception):
    """Raised when a station does not exist."""

    def __init__(self, message: str = "Estação não encontrada") -> None:
        super().__init__(message)


class StationPermissionException(Exception):
    """Raised when a user attempts to access a station they do not own."""

    def __init__(self, message: str = "Acesso negado à estação") -> None:
        super().__init__(message)


class InvalidCoordinatesException(Exception):
    """Raised when latitude/longitude values are out of range."""

    def __init__(self, message: str = "Coordenadas inválidas") -> None:
        super().__init__(message)
