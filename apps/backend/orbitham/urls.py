"""Root URL configuration for the OrbitHam project."""
from django.urls import path

from orbitham.api import api

urlpatterns = [
    path("api/", api.urls),
]
