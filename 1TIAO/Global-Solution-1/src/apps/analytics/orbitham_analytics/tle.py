"""Load TLE sets for the analytics notebooks.

Defaults to a small bundled CSV (guaranteed offline and reproducible). Can
optionally fetch a richer catalogue from CelesTrak when run with network
access, so the same notebooks scale from 4 satellites to 100+.
"""
from __future__ import annotations

import csv
import urllib.request
from dataclasses import dataclass
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SAMPLE_CSV = DATA_DIR / "sample_tles.csv"


@dataclass
class Tle:
    """A satellite's identity plus its Two-Line Element set."""

    norad_id: int
    name: str
    category: str
    tle_1: str
    tle_2: str


def load_sample() -> list[Tle]:
    """Load the bundled offline sample of real TLEs."""
    rows: list[Tle] = []
    with SAMPLE_CSV.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            rows.append(
                Tle(
                    norad_id=int(row["norad_id"]),
                    name=row["name"],
                    category=row["category"],
                    tle_1=row["tle_1"],
                    tle_2=row["tle_2"],
                )
            )
    return rows


def parse_tle_text(text: str, category: str = "amateur") -> list[Tle]:
    """Parse a CelesTrak-style 3-line (name + 2 TLE lines) text block."""
    lines = [line.rstrip() for line in text.splitlines() if line.strip()]
    out: list[Tle] = []
    for i in range(0, len(lines) - 2, 3):
        name, line1, line2 = lines[i], lines[i + 1], lines[i + 2]
        if not (line1.startswith("1 ") and line2.startswith("2 ")):
            continue
        try:
            norad = int(line1[2:7])
        except ValueError:
            continue
        out.append(Tle(norad, name.strip(), category, line1, line2))
    return out


def fetch_celestrak(group: str = "amateur", timeout: int = 15) -> list[Tle]:
    """Fetch a TLE group from CelesTrak (requires network access)."""
    url = (
        "https://celestrak.org/NORAD/elements/gp.php"
        f"?GROUP={group}&FORMAT=tle"
    )
    with urllib.request.urlopen(url, timeout=timeout) as resp:  # noqa: S310
        text = resp.read().decode("utf-8")
    return parse_tle_text(text, category=group)


def load_tles(prefer_online: bool = False, group: str = "amateur") -> list[Tle]:
    """Load TLEs, optionally trying CelesTrak first and falling back to sample."""
    if prefer_online:
        try:
            online = fetch_celestrak(group)
            if online:
                return online
        except Exception:  # noqa: BLE001 - offline fallback is intentional
            pass
    return load_sample()
