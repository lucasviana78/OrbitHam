import { describe, it, expect } from 'vitest';
import {
  parseTle,
  propagateAt,
  groundTrack,
  footprintRadiusKm,
  periodMinutes,
} from './orbital';

// Real ISS (ZARYA) TLE, epoch 2024 day 79.
const ISS_TLE_1 =
  '1 25544U 98067A   24079.07757601  .00016717  00000-0  30604-3 0  9993';
const ISS_TLE_2 =
  '2 25544  51.6402 211.2024 0003580  29.0817 331.0420 15.49386383442956';

describe('footprintRadiusKm', () => {
  it('gives a plausible LEO footprint (~2250 km at 420 km)', () => {
    const r = footprintRadiusKm(420);
    expect(r).toBeGreaterThan(2000);
    expect(r).toBeLessThan(2600);
  });

  it('gives a much larger footprint at geostationary altitude', () => {
    const r = footprintRadiusKm(35786);
    expect(r).toBeGreaterThan(8000);
    expect(r).toBeLessThan(9500);
  });
});

describe('parseTle / propagateAt', () => {
  it('throws on a malformed TLE', () => {
    expect(() => parseTle('garbage', 'more garbage')).toThrow();
  });

  it('propagates the ISS to a physically plausible state', () => {
    const satrec = parseTle(ISS_TLE_1, ISS_TLE_2);
    const state = propagateAt(satrec, new Date('2024-03-19T02:00:00Z'));
    expect(state).not.toBeNull();
    if (!state) return;
    expect(state.altitudeKm).toBeGreaterThan(380);
    expect(state.altitudeKm).toBeLessThan(440);
    // ISS inclination ~51.6° bounds the sub-point latitude.
    expect(Math.abs(state.lat)).toBeLessThanOrEqual(53);
    expect(state.lon).toBeGreaterThanOrEqual(-180);
    expect(state.lon).toBeLessThanOrEqual(180);
    expect(state.velocityKmS).toBeGreaterThan(7);
    expect(state.velocityKmS).toBeLessThan(8);
  });
});

describe('periodMinutes', () => {
  it('matches the ISS orbital period (~93 min)', () => {
    const satrec = parseTle(ISS_TLE_1, ISS_TLE_2);
    const period = periodMinutes(satrec);
    expect(period).toBeGreaterThan(88);
    expect(period).toBeLessThan(96);
  });
});

describe('groundTrack', () => {
  it('returns a series of valid coordinates spanning the window', () => {
    const satrec = parseTle(ISS_TLE_1, ISS_TLE_2);
    const pts = groundTrack(satrec, new Date('2024-03-19T02:00:00Z'), {
      backMinutes: 30,
      forwardMinutes: 30,
      stepSeconds: 60,
    });
    expect(pts.length).toBeGreaterThan(50);
    for (const [lon, lat] of pts) {
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(53);
    }
  });
});
