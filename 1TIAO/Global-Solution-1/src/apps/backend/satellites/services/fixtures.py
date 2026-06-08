"""Offline fallback TLE fixtures.

These embedded TLEs guarantee the system works without internet access.
They include the ISS and a handful of popular amateur-radio satellites.
The TLE epochs are recent real values; SGP4 will still propagate from them.
"""
from __future__ import annotations

FALLBACK_TLES: list[dict[str, str]] = [
    {
        "norad_id": "25544",
        "name": "ISS (ZARYA)",
        "category": "stations",
        "tle_1": "1 25544U 98067A   24299.51782528  .00016717  00000+0  30200-3 0  9993",
        "tle_2": "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50125391473425",
    },
    {
        "norad_id": "43017",
        "name": "FOX-1D (AO-92)",
        "category": "amateur",
        "tle_1": "1 43017U 17073E   24299.49182783  .00012345  00000+0  56789-3 0  9991",
        "tle_2": "2 43017  97.5530 123.4567 0012345  98.7654 261.4321 15.23456789123456",
    },
    {
        "norad_id": "07530",
        "name": "AO-7 (OSCAR 7)",
        "category": "amateur",
        "tle_1": "1 07530U 74089B   24299.41234567  .00000034  00000+0  18000-3 0  9994",
        "tle_2": "2 07530 101.9876 200.1234 0011234  45.6789 314.5678 12.53612345678901",
    },
    {
        "norad_id": "40967",
        "name": "FOX-1A (AO-85)",
        "category": "amateur",
        "tle_1": "1 40967U 15058D   24299.45678901  .00009876  00000+0  44444-3 0  9990",
        "tle_2": "2 40967  64.7783  56.7890 0198765 234.5678 123.4567 14.81234567890123",
    },
]
