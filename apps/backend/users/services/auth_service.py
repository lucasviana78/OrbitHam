"""Authentication and user-management business logic."""
from __future__ import annotations

from users.models import User
from users.repositories.user_repository import UserRepository
from users.services.exceptions import (
    AuthenticationFailedException,
    EmailAlreadyExistsException,
    InvalidTokenException,
    UsernameAlreadyExistsException,
    UserNotFoundException,
)
from users.services.jwt_service import JWTService


class AuthService:
    """Handles registration, login, token issuance and user lookups."""

    def __init__(
        self,
        repository: UserRepository | None = None,
        jwt_service: JWTService | None = None,
    ) -> None:
        self.repository = repository or UserRepository()
        self.jwt = jwt_service or JWTService()

    def register(self, *, email: str, username: str, password: str) -> User:
        """Register a new user.

        Raises ``EmailAlreadyExistsException`` / ``UsernameAlreadyExistsException``
        on conflicts.
        """
        if self.repository.exists_by_email(email):
            raise EmailAlreadyExistsException()
        if self.repository.exists_by_username(username):
            raise UsernameAlreadyExistsException()
        return self.repository.create(
            email=email, username=username, password=password
        )

    def authenticate(self, *, email: str, password: str) -> User:
        """Validate credentials and return the matching user.

        Raises ``AuthenticationFailedException`` if invalid.
        """
        user = self.repository.get_by_email(email)
        if user is None or not user.check_password(password):
            raise AuthenticationFailedException()
        if not user.is_active:
            raise AuthenticationFailedException("Usuário inativo")
        return user

    def issue_tokens(self, user: User) -> tuple[str, str]:
        """Return a ``(access_token, refresh_token)`` pair for the user."""
        return (
            self.jwt.create_access_token(user.id),
            self.jwt.create_refresh_token(user.id),
        )

    def get_user_from_access_token(self, token: str) -> User:
        """Resolve a user from an access token (used by the auth class)."""
        payload = self.jwt.decode(token, expected_type="access")
        return self._user_from_payload(payload)

    def refresh_access_token(self, refresh_token: str) -> str:
        """Issue a new access token from a valid refresh token."""
        payload = self.jwt.decode(refresh_token, expected_type="refresh")
        user = self._user_from_payload(payload)
        return self.jwt.create_access_token(user.id)

    def get_by_id(self, user_id: int) -> User:
        """Return a user by id or raise ``UserNotFoundException``."""
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise UserNotFoundException()
        return user

    def _user_from_payload(self, payload: dict) -> User:
        try:
            user_id = int(payload["sub"])
        except (KeyError, ValueError, TypeError) as exc:
            raise InvalidTokenException() from exc
        user = self.repository.get_by_id(user_id)
        if user is None or not user.is_active:
            raise InvalidTokenException("Usuário não encontrado")
        return user
