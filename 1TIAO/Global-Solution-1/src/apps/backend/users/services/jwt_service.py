"""JWT encoding/decoding helpers for cookie-based authentication."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
from django.conf import settings

from users.services.exceptions import InvalidTokenException


class JWTService:
    """Encodes and decodes access/refresh JWTs."""

    def _encode(self, user_id: int, token_type: str, lifetime: timedelta) -> str:
        now = datetime.now(tz=UTC)
        payload = {
            "sub": str(user_id),
            "type": token_type,
            "iat": now,
            "exp": now + lifetime,
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def create_access_token(self, user_id: int) -> str:
        """Create a signed access token for the given user id."""
        return self._encode(
            user_id,
            "access",
            timedelta(minutes=settings.JWT_ACCESS_TOKEN_LIFETIME_MINUTES),
        )

    def create_refresh_token(self, user_id: int) -> str:
        """Create a signed refresh token for the given user id."""
        return self._encode(
            user_id,
            "refresh",
            timedelta(days=settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS),
        )

    def decode(self, token: str, expected_type: str | None = None) -> dict:
        """Decode and validate a JWT, returning its payload.

        Raises ``InvalidTokenException`` if the token is invalid, expired or
        of an unexpected type.
        """
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.PyJWTError as exc:
            raise InvalidTokenException() from exc

        if expected_type is not None and payload.get("type") != expected_type:
            raise InvalidTokenException("Tipo de token inválido")
        return payload
