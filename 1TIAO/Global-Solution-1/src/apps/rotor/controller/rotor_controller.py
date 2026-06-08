"""Controlador do rotor de antena (OrbitHam / Global Solution FIAP).

Calcula o apontamento (azimute/elevacao) de um satelite sobre uma estacao em
tempo real, com Skyfield/SGP4 (o mesmo motor do app), e envia os angulos para
o ESP32 que move os servos.

Funciona com ou sem hardware:
  - com ESP32:  --esp32 192.168.0.50   (faz POST /point a cada segundo)
  - sem ESP32:  (sem --esp32)          modo simulacao, apenas imprime os angulos

Exemplos:
  python rotor_controller.py                          # ISS sobre Sao Paulo, simula
  python rotor_controller.py --name "ISS (ZARYA)"     # escolhe satelite do CSV
  python rotor_controller.py --esp32 192.168.0.50     # envia ao rotor de verdade
  python rotor_controller.py --lat -23.55 --lon -46.63 --alt 760
"""
from __future__ import annotations

import argparse
import csv
import math
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

from skyfield.api import EarthSatellite, load, wgs84

# TLE embutido (ISS) para funcionar mesmo sem o CSV.
ISS_NAME = "ISS (ZARYA)"
ISS_TLE1 = "1 25544U 98067A   24299.51782528  .00016717  00000+0  30200-3 0  9993"
ISS_TLE2 = "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50125391473425"

# CSV de TLEs compartilhado com o modulo de analise.
DEFAULT_CSV = (
    Path(__file__).resolve().parents[2] / "analytics" / "data" / "sample_tles.csv"
)


def load_tle(name: str, csv_path: Path) -> tuple[str, str, str]:
    """Retorna (nome, tle_1, tle_2) do CSV pelo nome, ou a ISS embutida."""
    if csv_path.exists():
        with csv_path.open(encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                if row["name"].strip().lower() == name.strip().lower():
                    return row["name"], row["tle_1"], row["tle_2"]
    return ISS_NAME, ISS_TLE1, ISS_TLE2


def post_to_esp32(base_url: str, az: float, el: float, visible: bool) -> None:
    """Envia o apontamento ao ESP32 (import preguicoso de requests)."""
    import requests  # noqa: PLC0415 - so necessario no modo hardware

    requests.post(
        f"{base_url.rstrip('/')}/point",
        data={"az": f"{az:.1f}", "el": f"{el:.1f}", "visible": "1" if visible else "0"},
        timeout=2,
    )


def run_demo(args, base: str | None) -> int:
    """Varredura sintetica de uma passagem (sobe, cruza o ceu e desce).

    Util para o video: faz os servos se moverem por um arco completo sem
    precisar esperar uma passagem real.
    """
    steps = args.count or 60
    print("Modo:     DEMO (varredura sintetica de uma passagem)")
    print("-" * 56)
    try:
        for i in range(steps):
            p = i / max(1, steps - 1)
            az_deg = (30.0 + args.demo_span * p) % 360.0
            el_deg = args.demo_maxel * math.sin(math.pi * p)
            visible = el_deg >= 0.5
            print(
                f"AZ {az_deg:6.1f}   EL {el_deg:6.1f}   "
                f"{'VISIVEL' if visible else '-'}"
            )
            if base:
                try:
                    post_to_esp32(base, az_deg, el_deg, visible)
                except Exception as exc:  # noqa: BLE001
                    print(f"  ! falha ao enviar ao ESP32: {exc}")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nEncerrado.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Controlador do rotor de antena ESP32")
    parser.add_argument("--esp32", help="IP/host do ESP32 (omitir = simula)")
    parser.add_argument("--name", default=ISS_NAME, help="nome do satelite no CSV")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="CSV de TLEs")
    parser.add_argument("--lat", type=float, default=-23.5505, help="latitude da estacao")
    parser.add_argument("--lon", type=float, default=-46.6333, help="longitude da estacao")
    parser.add_argument("--alt", type=float, default=760.0, help="altitude (m)")
    parser.add_argument("--interval", type=float, default=1.0, help="segundos entre updates")
    parser.add_argument("--count", type=int, default=0, help="nº de updates (0 = infinito)")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="varredura sintetica de uma passagem (move os servos para o video)",
    )
    parser.add_argument("--demo-maxel", type=float, default=70.0, help="elevacao de pico no demo")
    parser.add_argument("--demo-span", type=float, default=180.0, help="varredura de azimute no demo")
    args = parser.parse_args()

    base = f"http://{args.esp32}" if args.esp32 else None

    if args.demo:
        return run_demo(args, base)

    name, tle1, tle2 = load_tle(args.name, args.csv)
    ts = load.timescale()
    satellite = EarthSatellite(tle1, tle2, name, ts)
    observer = wgs84.latlon(args.lat, args.lon, elevation_m=args.alt)

    modo = f"ESP32 em {args.esp32}" if args.esp32 else "SIMULACAO (sem hardware)"
    print(f"Satelite: {name}")
    print(f"Estacao:  {args.lat:.4f}, {args.lon:.4f} ({args.alt:.0f} m)")
    print(f"Modo:     {modo}")
    print("-" * 56)

    sent = 0
    try:
        while args.count == 0 or sent < args.count:
            t = ts.from_datetime(datetime.now(tz=UTC))
            alt, az, distance = (satellite - observer).at(t).altaz()
            el_deg = alt.degrees
            az_deg = az.degrees
            visible = el_deg >= 0
            estado = "VISIVEL" if visible else "abaixo do horizonte"

            print(
                f"AZ {az_deg:6.1f}   EL {el_deg:6.1f}   "
                f"dist {distance.km:8.0f} km   {estado}"
            )

            if base:
                try:
                    post_to_esp32(base, az_deg, el_deg, visible)
                except Exception as exc:  # noqa: BLE001
                    print(f"  ! falha ao enviar ao ESP32: {exc}")

            sent += 1
            if args.count == 0 or sent < args.count:
                time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nEncerrado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
