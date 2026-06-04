"""Idempotent seed command: demo user + station + satellite import."""
from __future__ import annotations

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from stations.models import Station
from users.models import User


class Command(BaseCommand):
    """Create the demo user/station and import satellites (idempotent)."""

    help = "Seed a demo user, a demo station, and import satellites."

    def handle(self, *args, **options) -> None:
        email = settings.DEMO_USER_EMAIL
        password = settings.DEMO_USER_PASSWORD

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User.objects.create_user(
                email=email, username="demo", password=password
            )
            self.stdout.write(self.style.SUCCESS(f"Created demo user {email}"))
        else:
            self.stdout.write(f"Demo user {email} already exists")

        station, created = Station.objects.get_or_create(
            user=user,
            callsign="PU2DEMO",
            defaults={
                "name": "Estação Demo São Paulo",
                "latitude": -23.5505,
                "longitude": -46.6333,
                "altitude": 760.0,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created demo station PU2DEMO"))
        else:
            self.stdout.write("Demo station PU2DEMO already exists")

        self.stdout.write("Importing satellites...")
        call_command("import_satellites")
        self.stdout.write(self.style.SUCCESS("seed_demo complete"))
