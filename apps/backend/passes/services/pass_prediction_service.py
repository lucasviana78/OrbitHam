"""Pass-prediction business logic using Skyfield/SGP4."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from skyfield.api import EarthSatellite, load, wgs84

# Minimum elevation (degrees) for a pass to count.
MIN_ELEVATION_DEG = 10.0


@dataclass
class PassWindow:
    """A single satellite pass over a ground station."""

    rise: datetime
    peak: datetime
    set: datetime
    max_elevation: float


class PassPredictionService:
    """Predicts visible satellite passes for a ground station."""

    def __init__(self) -> None:
        self._ts = load.timescale()

    def calculate_passes(
        self,
        *,
        tle_1: str,
        tle_2: str,
        latitude: float,
        longitude: float,
        altitude_m: float,
        days: int = 3,
        name: str = "satellite",
        start: datetime | None = None,
    ) -> list[PassWindow]:
        """Return the passes for a satellite over a station.

        Uses Skyfield's ``find_events`` with a 10° horizon. ``rise``/``peak``/
        ``set`` are timezone-aware UTC datetimes; ``max_elevation`` is degrees.
        """
        days = max(1, min(int(days), 10))
        satellite = EarthSatellite(tle_1, tle_2, name, self._ts)
        observer = wgs84.latlon(
            latitude_degrees=latitude,
            longitude_degrees=longitude,
            elevation_m=altitude_m,
        )

        start_dt = start or datetime.now(tz=UTC)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=UTC)
        t0 = self._ts.from_datetime(start_dt)
        end_dt = start_dt.timestamp() + days * 86400
        t1 = self._ts.from_datetime(
            datetime.fromtimestamp(end_dt, tz=UTC)
        )

        times, events = satellite.find_events(
            observer, t0, t1, altitude_degrees=MIN_ELEVATION_DEG
        )

        passes: list[PassWindow] = []
        current: dict[str, datetime | float] = {}
        for ti, event in zip(times, events, strict=False):
            when = ti.utc_datetime()
            if event == 0:  # rise
                current = {"rise": when}
            elif event == 1:  # culmination / peak
                if "rise" in current:
                    alt, _, _ = (satellite - observer).at(ti).altaz()
                    current["peak"] = when
                    current["max_elevation"] = round(alt.degrees, 1)
            elif event == 2:  # set
                if "rise" in current and "peak" in current:
                    current["set"] = when
                    passes.append(
                        PassWindow(
                            rise=current["rise"],
                            peak=current["peak"],
                            set=current["set"],
                            max_elevation=float(current["max_elevation"]),
                        )
                    )
                current = {}

        passes.sort(key=lambda p: p.rise)
        return passes
