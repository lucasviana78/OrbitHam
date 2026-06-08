"""Orbital decay analysis via SGP4 forward propagation (Skyfield).

We propagate a satellite's current TLE forward in time, sample its sub-point
altitude, smooth the per-orbit oscillation into a daily mean, then fit a
regression to estimate the decay rate and a naive reentry horizon.

Caveat (stated honestly in the notebook): a single TLE propagated far into the
future is only approximate. SGP4 models atmospheric drag through the B* term,
so the *trend* is meaningful, but absolute long-range reentry dates are rough.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import numpy as np
import pandas as pd
from skyfield.api import EarthSatellite, load, wgs84

# Conventional altitude (km) at which a satellite is considered to reenter.
REENTRY_ALTITUDE_KM = 120.0


def altitude_series(
    tle_1: str,
    tle_2: str,
    name: str = "sat",
    days: int = 730,
    step_hours: float = 6.0,
    start: datetime | None = None,
    ts=None,
) -> pd.DataFrame:
    """Propagate the TLE forward and sample sub-point altitude over time.

    Returns a DataFrame with columns ``time`` (UTC) and ``altitude_km``.
    """
    ts = ts or load.timescale()
    satellite = EarthSatellite(tle_1, tle_2, name, ts)

    start = start or datetime.now(tz=UTC)
    if start.tzinfo is None:
        start = start.replace(tzinfo=UTC)

    count = int(days * 24 / step_hours) + 1
    times = [start + timedelta(hours=step_hours * i) for i in range(count)]
    t = ts.from_datetimes(times)

    geocentric = satellite.at(t)
    subpoint = wgs84.subpoint(geocentric)
    altitude_km = np.asarray(subpoint.elevation.km, dtype=float)

    frame = pd.DataFrame({"time": times, "altitude_km": altitude_km})
    # Drop non-finite samples (SGP4 returns NaN once an orbit has decayed).
    frame = frame[np.isfinite(frame["altitude_km"])].reset_index(drop=True)
    return frame


def daily_mean_altitude(series: pd.DataFrame) -> pd.DataFrame:
    """Collapse the oscillating altitude into a smooth daily mean.

    Adds a ``day`` column (days since the first sample) for regression.
    """
    daily = (
        series.set_index("time")
        .resample("1D")["altitude_km"]
        .mean()
        .dropna()
        .reset_index()
    )
    daily["day"] = (
        daily["time"] - daily["time"].iloc[0]
    ).dt.total_seconds() / 86400.0
    return daily


def fit_decay(daily: pd.DataFrame, degree: int = 2):
    """Fit altitude vs day with a polynomial. Returns (poly, coeffs)."""
    x = daily["day"].to_numpy()
    y = daily["altitude_km"].to_numpy()
    coeffs = np.polyfit(x, y, degree)
    return np.poly1d(coeffs), coeffs


def decay_rate_km_per_year(daily: pd.DataFrame) -> float:
    """Average altitude change per year from a straight-line fit (negative = decaying)."""
    x = daily["day"].to_numpy()
    y = daily["altitude_km"].to_numpy()
    slope_per_day = np.polyfit(x, y, 1)[0]
    return float(slope_per_day * 365.25)


def estimate_reentry_day(
    poly, max_day: int = 6000, threshold_km: float = REENTRY_ALTITUDE_KM
) -> int | None:
    """First day where the fitted altitude drops to the reentry threshold."""
    for day in range(max_day):
        if poly(day) <= threshold_km:
            return day
    return None
