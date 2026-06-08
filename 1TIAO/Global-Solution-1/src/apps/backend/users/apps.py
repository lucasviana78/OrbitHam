"""App configuration for the users module."""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Configuration for the users Django app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "users"
