/**
 * Solar geometry: the subsolar point (where the Sun is at the zenith) and the
 * night-side polygon (the terminator shadow), drawn on the tracking map.
 *
 * Low-precision algorithm (USNO / NOAA), accurate to a few arc-minutes — more
 * than enough for a day/night overlay.
 */
import { normalizeLon, type LngLat } from './geo';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Julian days since the J2000.0 epoch. */
function daysSinceJ2000(date: Date): number {
  return date.getTime() / 86_400_000 - 10_957.5;
}

export interface SubsolarPoint {
  /** Solar declination = subsolar latitude (degrees, ±23.44). */
  lat: number;
  /** Subsolar longitude (degrees, -180..180). */
  lon: number;
}

/** Compute the subsolar point for a given instant. */
export function subsolarPoint(date: Date): SubsolarPoint {
  const d = daysSinceJ2000(date);

  const g = (357.529 + 0.98560028 * d) * DEG; // mean anomaly
  const q = 280.459 + 0.98564736 * d; // mean longitude (deg)
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG; // ecliptic lon
  const e = (23.439 - 0.00000036 * d) * DEG; // obliquity

  const declination = Math.asin(Math.sin(e) * Math.sin(L)); // rad
  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)); // rad

  // Greenwich Mean Sidereal Time (degrees).
  const gmst = 280.46061837 + 360.98564736629 * d;

  const lat = declination * RAD;
  const lon = normalizeLon(rightAscension * RAD - gmst);
  return { lat, lon };
}

/**
 * Build a filled polygon covering the night side of the Earth at `date`.
 * For each longitude the terminator latitude is derived from the subsolar
 * point, then the ring is closed over the dark pole.
 */
export function nightPolygon(date: Date, stepDeg = 2): LngLat[] {
  const sun = subsolarPoint(date);
  const decl = sun.lat * DEG;

  // Avoid a singularity at the equinox (decl → 0).
  const tanDecl = Math.tan(decl) || 1e-9;

  const terminator: LngLat[] = [];
  for (let lon = -180; lon <= 180; lon += stepDeg) {
    const hourAngle = (lon - sun.lon) * DEG;
    // Latitude where the Sun is exactly on the horizon.
    const lat = Math.atan(-Math.cos(hourAngle) / tanDecl) * RAD;
    terminator.push([lon, lat]);
  }

  // The pole in darkness is the one opposite in sign to the declination.
  const darkPole = sun.lat >= 0 ? -90 : 90;
  const ring: LngLat[] = [...terminator];
  ring.push([180, darkPole]);
  ring.push([-180, darkPole]);
  ring.push(terminator[0]);
  return ring;
}
