"""WSGI config for the OrbitHam project."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "orbitham.settings")

application = get_wsgi_application()
