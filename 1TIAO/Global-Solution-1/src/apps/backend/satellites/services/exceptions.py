"""Custom exceptions for the satellites module."""
from __future__ import annotations


class SatelliteNotFoundException(Exception):
    """Raised when a satellite does not exist."""

    def __init__(self, message: str = "Satélite não encontrado") -> None:
        super().__init__(message)
