"""Management command to import satellite TLEs (Celestrak + offline fallback)."""
from __future__ import annotations

from django.core.management.base import BaseCommand

from satellites.services.import_service import TLEImportService


class Command(BaseCommand):
    """Import or refresh satellite TLE data."""

    help = "Import satellites/TLEs from Celestrak with offline fixture fallback."

    def handle(self, *args, **options) -> None:
        count = TLEImportService().import_satellites()
        self.stdout.write(
            self.style.SUCCESS(f"Imported/updated {count} satellites.")
        )
