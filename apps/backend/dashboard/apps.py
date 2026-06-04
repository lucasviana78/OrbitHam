"""App configuration for the dashboard module."""
from django.apps import AppConfig


class DashboardConfig(AppConfig):
    """Configuration for the dashboard Django app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "dashboard"
