FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System dependencies (psycopg, numpy/skyfield build deps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /app

EXPOSE 8000

# Default command (docker-compose overrides with migrate + seed_demo + gunicorn)
CMD ["gunicorn", "orbitham.wsgi:application", "-b", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
