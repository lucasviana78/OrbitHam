"""Satellite and TLE history models."""
from __future__ import annotations

from django.db import models


class Satellite(models.Model):
    """A satellite with its latest Two-Line Element set."""

    norad_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=50, default="amateur")
    status = models.CharField(max_length=20, default="active")
    # Downlink frequency in MHz, used for the live Doppler calculation.
    downlink_mhz = models.FloatField(null=True, blank=True)
    tle_1 = models.CharField(max_length=80)
    tle_2 = models.CharField(max_length=80)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "satellites"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.norad_id})"


class SatelliteTLEHistory(models.Model):
    """Historical record of a satellite's TLE values."""

    satellite = models.ForeignKey(
        Satellite,
        on_delete=models.CASCADE,
        related_name="tle_history",
    )
    tle_1 = models.CharField(max_length=80)
    tle_2 = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "satellite_tle_history"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"TLE history for {self.satellite_id} @ {self.created_at}"
