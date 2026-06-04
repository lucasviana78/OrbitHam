"""App configuration for the stations module."""
from django.apps import AppConfig


class StationsConfig(AppConfig):
    """Configuration for the stations Django app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "stations"
