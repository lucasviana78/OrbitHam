/**
 * Geographic helpers for drawing satellite tracks and footprints on a map.
 * All angles in degrees; coordinates as GeoJSON [lon, lat] pairs.
 */

export const EARTH_RADIUS_KM = 6371.0088;

export type LngLat = [number, number]; // [lon, lat]

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Normalise a longitude to the [-180, 180] range. */
export function normalizeLon(lon: number): number {
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  if (l === -180) l = 180;
  return l;
}

/**
 * Geodesic circle (ring of [lon, lat]) of a given ground radius around a
 * centre point. Used for the satellite footprint. Longitudes are kept
 * continuous relative to the centre (may fall outside ±180) so MapLibre can
 * render the polygon without an antimeridian smear.
 */
export function geodesicCircle(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  steps = 128,
): LngLat[] {
  const ring: LngLat[] = [];
  const angular = radiusKm / EARTH_RADIUS_KM; // central angle (rad)
  const lat1 = centerLat * DEG;
  const lon1 = centerLon * DEG;
  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAng = Math.sin(angular);
  const cosAng = Math.cos(angular);

  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const sinLat2 = sinLat1 * cosAng + cosLat1 * sinAng * Math.cos(bearing);
    const lat2 = Math.asin(Math.min(1, Math.max(-1, sinLat2)));
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * sinAng * cosLat1,
        cosAng - sinLat1 * sinLat2,
      );
    // Keep longitude continuous around the centre (no wrap).
    ring.push([lon2 * RAD, lat2 * RAD]);
  }
  return ring;
}

/**
 * Split a polyline into segments wherever it crosses the antimeridian
 * (a longitude jump greater than 180°), so a track drawn around the globe
 * does not produce a horizontal line slashing across the map.
 * Returns an array of segments (each a list of [lon, lat]).
 */
export function splitAntimeridian(points: LngLat[]): LngLat[][] {
  const segments: LngLat[][] = [];
  let current: LngLat[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      const prevLon = points[i - 1][0];
      const lon = points[i][0];
      if (Math.abs(lon - prevLon) > 180) {
        segments.push(current);
        current = [];
      }
    }
    current.push(points[i]);
  }
  if (current.length) segments.push(current);
  return segments;
}
