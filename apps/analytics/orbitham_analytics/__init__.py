"""OrbitHam analytics: orbital decay and pass-window analysis in Python.

Self-contained (no Django) so the notebooks run reproducibly. Mirrors the
domain used by the main app (Skyfield/SGP4 propagation, the same elevation
quality thresholds shown in the dashboard).
"""
from .quality import elevation_quality, EXCELLENT_MIN_DEG, MEDIUM_MIN_DEG
from .tle import Tle, load_sample, load_tles, fetch_celestrak, parse_tle_text
from .decay import (
    altitude_series,
    daily_mean_altitude,
    fit_decay,
    decay_rate_km_per_year,
    estimate_reentry_day,
    REENTRY_ALTITUDE_KM,
)
from .passes import build_pass_dataset

__all__ = [
    "elevation_quality",
    "EXCELLENT_MIN_DEG",
    "MEDIUM_MIN_DEG",
    "Tle",
    "load_sample",
    "load_tles",
    "fetch_celestrak",
    "parse_tle_text",
    "altitude_series",
    "daily_mean_altitude",
    "fit_decay",
    "decay_rate_km_per_year",
    "estimate_reentry_day",
    "REENTRY_ALTITUDE_KM",
    "build_pass_dataset",
]
