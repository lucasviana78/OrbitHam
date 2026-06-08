/**
 * Client-side orbital propagation using satellite.js (SGP4).
 *
 * The backend serves the TLE; the browser propagates it so the live position,
 * ground track and footprint update smoothly without any server round-trips.
 */
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  eciToEcf,
  ecfToLookAngles,
  degreesToRadians,
  degreesLat,
  degreesLong,
  type SatRec,
  type EciVec3,
} from 'satellite.js';
import { EARTH_RADIUS_KM, normalizeLon, type LngLat } from './geo';

/** A ground observer (e.g. a station) used to compute look angles. */
export interface Observer {
  /** Latitude in degrees. */
  latitude: number;
  /** Longitude in degrees. */
  longitude: number;
  /** Height above sea level, kilometres. */
  altitudeKm: number;
}

export interface SatState {
  lat: number;
  lon: number;
  /** Altitude above the ellipsoid, kilometres. */
  altitudeKm: number;
  /** Scalar speed, kilometres per second. */
  velocityKmS: number;
  /** Slant range to the observer in km (only when an observer is given). */
  rangeKm?: number;
  /** Elevation above the observer's horizon in degrees (negative = hidden). */
  elevationDeg?: number;
  /** Azimuth from the observer in degrees (0=N, 90=E), antenna heading. */
  azimuthDeg?: number;
}

/** Parse a TLE pair into an SGP4 record. Throws if the TLE is malformed. */
export function parseTle(tle1: string, tle2: string): SatRec {
  const satrec = twoline2satrec(tle1.trim(), tle2.trim());
  // satrec.error stays 0 for garbage input that merely parses to NaN, so also
  // require a finite, positive mean motion before trusting the record.
  if (satrec.error || !Number.isFinite(satrec.no) || satrec.no <= 0) {
    throw new Error(`TLE inválido (código ${satrec.error}).`);
  }
  return satrec;
}

/** Orbital period in minutes, derived from the mean motion (rad/min). */
export function periodMinutes(satrec: SatRec): number {
  // satrec.no is mean motion in radians per minute.
  return (2 * Math.PI) / satrec.no;
}

/**
 * Propagate the satellite to `date` and return its sub-point and speed.
 * Returns null if SGP4 fails for that time (e.g. decayed orbit).
 */
export function propagateAt(
  satrec: SatRec,
  date: Date,
  observer?: Observer,
): SatState | null {
  const pv = propagate(satrec, date);
  const position = pv.position as EciVec3<number> | false;
  const velocity = pv.velocity as EciVec3<number> | false;
  if (!position) return null;

  const gmst = gstime(date);
  const geo = eciToGeodetic(position, gmst);
  const velocityKmS = velocity
    ? Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2)
    : 0;

  const state: SatState = {
    lat: degreesLat(geo.latitude),
    lon: normalizeLon(degreesLong(geo.longitude)),
    altitudeKm: geo.height,
    velocityKmS,
  };

  if (observer) {
    const ecf = eciToEcf(position, gmst);
    const look = ecfToLookAngles(
      {
        latitude: degreesToRadians(observer.latitude),
        longitude: degreesToRadians(observer.longitude),
        height: observer.altitudeKm,
      },
      ecf,
    );
    state.rangeKm = look.rangeSat;
    state.elevationDeg = look.elevation * (180 / Math.PI);
    state.azimuthDeg = look.azimuth * (180 / Math.PI);
  }

  return state;
}

/**
 * Sample the ground track over a time window around `center`.
 * Defaults to one full orbit in the past and one ahead, so the map shows the
 * incoming and outgoing passes like N2YO. Longitudes are normalised; callers
 * should split on the antimeridian before drawing.
 */
export function groundTrack(
  satrec: SatRec,
  center: Date,
  opts: { backMinutes?: number; forwardMinutes?: number; stepSeconds?: number } = {},
): LngLat[] {
  const period = periodMinutes(satrec);
  const backMinutes = opts.backMinutes ?? period * 0.6;
  const forwardMinutes = opts.forwardMinutes ?? period * 1.0;
  const stepSeconds = opts.stepSeconds ?? 20;

  const points: LngLat[] = [];
  const start = center.getTime() - backMinutes * 60_000;
  const end = center.getTime() + forwardMinutes * 60_000;
  for (let t = start; t <= end; t += stepSeconds * 1000) {
    const state = propagateAt(satrec, new Date(t));
    if (state) points.push([state.lon, state.lat]);
  }
  return points;
}

/**
 * Ground radius (km) of the area from which the satellite is above the horizon
 * — the footprint. Derived from the geometric horizon at the given altitude.
 */
export function footprintRadiusKm(altitudeKm: number): number {
  const ratio = EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm);
  const centralAngle = Math.acos(Math.min(1, Math.max(-1, ratio)));
  return EARTH_RADIUS_KM * centralAngle;
}
