"""Pass quality classification by peak elevation.

These thresholds match the colour-coded dots shown in the app's passes table,
so the analysis stays consistent with what the operator sees in the product.
"""
from __future__ import annotations

EXCELLENT_MIN_DEG = 45.0
MEDIUM_MIN_DEG = 25.0


def elevation_quality(max_elevation_deg: float) -> str:
    """Return 'Excelente', 'Média' or 'Ruim' for a pass's peak elevation."""
    if max_elevation_deg >= EXCELLENT_MIN_DEG:
        return "Excelente"
    if max_elevation_deg >= MEDIUM_MIN_DEG:
        return "Média"
    return "Ruim"
