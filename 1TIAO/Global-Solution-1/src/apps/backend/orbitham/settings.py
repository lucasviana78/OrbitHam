"""Django settings for the OrbitHam project.

Configuration is driven by environment variables (see .env / docker-compose).
For tests, a SQLite in-memory database is used automatically when running
under pytest or when DJANGO_TEST=1 is set, so Postgres is not required.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover - dotenv is optional at runtime
    pass

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool = False) -> bool:
    """Read a boolean environment variable."""
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    """Read a comma-separated environment variable into a list."""
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-change-me")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1") or ["*"]

# Detect test mode (pytest or DJANGO_TEST=1)
TESTING = env_bool("DJANGO_TEST", False) or "pytest" in sys.modules or any(
    arg in {"test", "pytest"} for arg in sys.argv
)

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    # Project apps
    "users",
    "stations",
    "satellites",
    "passes",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
]

ROOT_URLCONF = "orbitham.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "orbitham.wsgi.application"
ASGI_APPLICATION = "orbitham.asgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
if TESTING:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "orbitham"),
            "USER": os.environ.get("POSTGRES_USER", "orbitham"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "orbitham"),
            "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model
AUTH_USER_MODEL = "users.User"

# ---------------------------------------------------------------------------
# Password hashing / validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
]

# ---------------------------------------------------------------------------
# I18N
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static
# ---------------------------------------------------------------------------
STATIC_URL = "/django-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ---------------------------------------------------------------------------
# Security / cookies
# ---------------------------------------------------------------------------
COOKIE_SECURE = env_bool("COOKIE_SECURE", False)
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "Lax")
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS", "http://localhost,http://127.0.0.1"
)

# ---------------------------------------------------------------------------
# JWT / Auth
# ---------------------------------------------------------------------------
JWT_SECRET = os.environ.get("DJANGO_SECRET_KEY", SECRET_KEY)
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_LIFETIME_MINUTES = int(
    os.environ.get("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", "30")
)
JWT_REFRESH_TOKEN_LIFETIME_DAYS = int(
    os.environ.get("JWT_REFRESH_TOKEN_LIFETIME_DAYS", "7")
)
ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("REDIS_URL", CELERY_BROKER_URL)
CELERY_TASK_ALWAYS_EAGER = TESTING
CELERY_TIMEZONE = "UTC"

# ---------------------------------------------------------------------------
# Demo seed
# ---------------------------------------------------------------------------
DEMO_USER_EMAIL = os.environ.get("DEMO_USER_EMAIL", "demo@orbitham.com")
DEMO_USER_PASSWORD = os.environ.get("DEMO_USER_PASSWORD", "demo12345")

# ---------------------------------------------------------------------------
# Celestrak import
# ---------------------------------------------------------------------------
CELESTRAK_URLS = [
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=tle",
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
]
CELESTRAK_TIMEOUT_SECONDS = int(os.environ.get("CELESTRAK_TIMEOUT_SECONDS", "10"))
