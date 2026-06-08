"""Radio station model."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Station(models.Model):
    """A ham-radio ground station owned by a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stations",
    )
    name = models.CharField(max_length=120)
    latitude = models.FloatField()
    longitude = models.FloatField()
    altitude = models.FloatField(default=0.0)
    callsign = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stations"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.callsign} ({self.name})"
