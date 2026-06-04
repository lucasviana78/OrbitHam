"""Helpers for the standard API response envelope."""
from __future__ import annotations

from typing import Any


def ok(data: Any) -> dict[str, Any]:
    """Wrap a payload in the success envelope ``{"success": true, "data": ...}``."""
    return {"success": True, "data": data}
