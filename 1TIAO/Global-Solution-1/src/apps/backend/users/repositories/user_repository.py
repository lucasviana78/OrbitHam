"""Repository for User persistence (CRUD only, no business logic)."""
from __future__ import annotations

from users.models import User


class UserRepository:
    """Data-access layer for the User model."""

    def get_by_id(self, user_id: int) -> User | None:
        """Return a user by primary key, or ``None`` if not found."""
        return User.objects.filter(id=user_id).first()

    def get_by_email(self, email: str) -> User | None:
        """Return a user by email, or ``None`` if not found."""
        return User.objects.filter(email__iexact=email).first()

    def exists_by_email(self, email: str) -> bool:
        """Return whether a user with the given email exists."""
        return User.objects.filter(email__iexact=email).exists()

    def exists_by_username(self, username: str) -> bool:
        """Return whether a user with the given username exists."""
        return User.objects.filter(username=username).exists()

    def create(self, *, email: str, username: str, password: str) -> User:
        """Create a new user with a hashed password."""
        return User.objects.create_user(
            email=email, username=username, password=password
        )
