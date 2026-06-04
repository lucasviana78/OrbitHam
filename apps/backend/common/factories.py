"""Factory-boy factories shared across tests."""
from __future__ import annotations

import factory

from satellites.models import Satellite
from stations.models import Station
from users.models import User


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for the User model."""

    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "password123")
        return model_class.objects.create_user(password=password, **kwargs)


class StationFactory(factory.django.DjangoModelFactory):
    """Factory for the Station model."""

    class Meta:
        model = Station

    user = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f"Station {n}")
    latitude = -23.5505
    longitude = -46.6333
    altitude = 760.0
    callsign = factory.Sequence(lambda n: f"PU2{n:03d}")


class SatelliteFactory(factory.django.DjangoModelFactory):
    """Factory for the Satellite model (defaults to the ISS TLE)."""

    class Meta:
        model = Satellite

    norad_id = factory.Sequence(lambda n: 25544 + n)
    name = "ISS (ZARYA)"
    category = "stations"
    status = "active"
    tle_1 = (
        "1 25544U 98067A   24299.51782528  .00016717  "
        "00000+0  30200-3 0  9993"
    )
    tle_2 = (
        "2 25544  51.6416 247.4627 0006703 130.5360 "
        "325.0288 15.50125391473425"
    )
