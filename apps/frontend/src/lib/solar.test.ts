import { describe, it, expect } from 'vitest';
import { subsolarPoint, nightPolygon } from './solar';

describe('subsolarPoint', () => {
  it('sits near the Tropic of Cancer at the June solstice', () => {
    const sun = subsolarPoint(new Date('2024-06-20T12:00:00Z'));
    expect(sun.lat).toBeGreaterThan(23);
    expect(sun.lat).toBeLessThan(23.45);
  });

  it('sits near the Tropic of Capricorn at the December solstice', () => {
    const sun = subsolarPoint(new Date('2024-12-21T12:00:00Z'));
    expect(sun.lat).toBeLessThan(-23);
    expect(sun.lat).toBeGreaterThan(-23.45);
  });

  it('keeps the subsolar latitude within the obliquity bound', () => {
    for (const iso of ['2024-01-15', '2024-03-20', '2024-09-22', '2024-11-01']) {
      const sun = subsolarPoint(new Date(`${iso}T00:00:00Z`));
      expect(Math.abs(sun.lat)).toBeLessThanOrEqual(23.5);
      expect(sun.lon).toBeGreaterThanOrEqual(-180);
      expect(sun.lon).toBeLessThanOrEqual(180);
    }
  });

  it('places the subsolar point near the noon meridian at 12:00 UTC', () => {
    const sun = subsolarPoint(new Date('2024-03-20T12:00:00Z'));
    expect(Math.abs(sun.lon)).toBeLessThan(15);
  });
});

describe('nightPolygon', () => {
  it('returns a closed ring', () => {
    const ring = nightPolygon(new Date('2024-06-20T12:00:00Z'));
    expect(ring.length).toBeGreaterThan(10);
    expect(ring[0][0]).toBeCloseTo(ring[ring.length - 1][0], 6);
    expect(ring[0][1]).toBeCloseTo(ring[ring.length - 1][1], 6);
  });
});
