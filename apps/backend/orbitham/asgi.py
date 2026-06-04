"""ASGI config for the OrbitHam project."""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "orbitham.settings")

application = get_asgi_application()
