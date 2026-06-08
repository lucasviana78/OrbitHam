"""Pass-dataset generation for the 'best windows' analysis (Skyfield).

Mirrors the backend's pass prediction (Skyfield ``find_events`` with a 10°
horizon) but returns a tidy pandas DataFrame with engineered features ready for
exploratory analysis and an introductory ML model.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pandas as pd
from skyfield.api import EarthSatellite, load, wgs84

from .quality import elevation_quality
from .tle import Tle

MIN_ELEVATION_DEG = 10.0
# Brazil standard time (UTC-3, no DST in effect) for local-time features.
DEFAULT_TZ_OFFSET_HOURS = -3


def _passes_for_satellite(tle: Tle, observer, t0, t1, ts) -> list[dict]:
    satellite = EarthSatellite(tle.tle_1, tle.tle_2, tle.name, ts)
    times, events = satellite.find_events(
        observer, t0, t1, altitude_degrees=MIN_ELEVATION_DEG
    )
    rows: list[dict] = []
    current: dict = {}
    for ti, event in zip(times, events):
        when = ti.utc_datetime()
        if event == 0:  # rise
            current = {"rise": when}
        elif event == 1:  # culmination / peak
            if "rise" in current:
                alt, _, _ = (satellite - observer).at(ti).altaz()
                current["peak"] = when
                current["max_elevation"] = float(alt.degrees)
        elif event == 2:  # set
            if "rise" in current and "peak" in current:
                current["set"] = when
                rows.append(
                    {
                        "satellite": tle.name,
                        "rise": current["rise"],
                        "peak": current["peak"],
                        "set": current["set"],
                        "max_elevation": round(current["max_elevation"], 1),
                    }
                )
            current = {}
    return rows


def build_pass_dataset(
    tles: list[Tle],
    latitude: float,
    longitude: float,
    altitude_m: float = 0.0,
    days: int = 14,
    start: datetime | None = None,
    tz_offset_hours: int = DEFAULT_TZ_OFFSET_HOURS,
) -> pd.DataFrame:
    """Generate every pass for the given satellites over a station.

    Columns: satellite, rise/peak/set (UTC), max_elevation, duration_min,
    hour (local), weekday (local, 0=Mon), date (local), quality.
    """
    ts = load.timescale()
    observer = wgs84.latlon(latitude, longitude, elevation_m=altitude_m)

    start = start or datetime.now(tz=UTC)
    if start.tzinfo is None:
        start = start.replace(tzinfo=UTC)
    t0 = ts.from_datetime(start)
    t1 = ts.from_datetime(start + timedelta(days=days))

    rows: list[dict] = []
    for tle in tles:
        rows.extend(_passes_for_satellite(tle, observer, t0, t1, ts))

    frame = pd.DataFrame(rows)
    if frame.empty:
        return frame

    for col in ("rise", "peak", "set"):
        frame[col] = pd.to_datetime(frame[col], utc=True)

    local_rise = frame["rise"] + pd.Timedelta(hours=tz_offset_hours)
    frame["duration_min"] = (
        frame["set"] - frame["rise"]
    ).dt.total_seconds() / 60.0
    frame["hour"] = local_rise.dt.hour
    frame["weekday"] = local_rise.dt.weekday
    frame["date"] = local_rise.dt.date
    frame["quality"] = frame["max_elevation"].apply(elevation_quality)

    return frame.sort_values("rise").reset_index(drop=True)
