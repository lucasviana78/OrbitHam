"""User model for OrbitHam."""
from __future__ import annotations

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Manager for the custom User model."""

    use_in_migrations = True

    def create_user(
        self, email: str, username: str, password: str, **extra_fields
    ) -> User:
        """Create and persist a regular user with a hashed password."""
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email: str, username: str, password: str, **extra_fields
    ) -> User:
        """Create a superuser (used by createsuperuser)."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser):
    """Application user authenticated by email."""

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return self.email

    def has_perm(self, perm: str, obj=None) -> bool:  # pragma: no cover
        return self.is_superuser

    def has_module_perms(self, app_label: str) -> bool:  # pragma: no cover
        return self.is_superuser
