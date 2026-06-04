import { describe, it, expect } from 'vitest';
import {
  normalizeLon,
  geodesicCircle,
  splitAntimeridian,
  EARTH_RADIUS_KM,
} from './geo';

describe('normalizeLon', () => {
  it('wraps longitudes into [-180, 180]', () => {
    expect(normalizeLon(190)).toBeCloseTo(-170, 6);
    expect(normalizeLon(-190)).toBeCloseTo(170, 6);
    expect(normalizeLon(0)).toBe(0);
    expect(normalizeLon(360)).toBeCloseTo(0, 6);
    expect(normalizeLon(540)).toBeCloseTo(180, 6);
  });
});

describe('geodesicCircle', () => {
  it('returns a closed ring of steps+1 points within valid bounds', () => {
    const ring = geodesicCircle(0, 0, 2200, 64);
    expect(ring).toHaveLength(65);
    expect(ring[0][0]).toBeCloseTo(ring[64][0], 4);
    expect(ring[0][1]).toBeCloseTo(ring[64][1], 4);
    for (const [, lat] of ring) {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }
  });

  it('places the first point at the expected angular distance north', () => {
    const radiusKm = 2200;
    const ring = geodesicCircle(0, 0, radiusKm, 64);
    const expectedLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
    expect(ring[0][1]).toBeCloseTo(expectedLat, 1);
  });
});

describe('splitAntimeridian', () => {
  it('splits a track that crosses the antimeridian', () => {
    const segments = splitAntimeridian([
      [170, 0],
      [179, 0],
      [-179, 1],
      [-170, 1],
    ]);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveLength(2);
    expect(segments[1]).toHaveLength(2);
  });

  it('keeps a non-crossing track in a single segment', () => {
    const segments = splitAntimeridian([
      [10, 0],
      [20, 1],
      [30, 2],
    ]);
    expect(segments).toHaveLength(1);
  });
});
