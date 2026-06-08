import { describe, it, expect } from 'vitest';
import { cn, formatElevation, formatDateTime } from './utils';

describe('cn', () => {
  it('merges and dedupes tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe(
      'text-sm font-bold',
    );
  });
});

describe('formatElevation', () => {
  it('formats with one decimal and a degree symbol', () => {
    expect(formatElevation(74.234)).toBe('74.2°');
  });
});

describe('formatDateTime', () => {
  it('returns the original string when unparseable', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
  });

  it('formats a valid ISO date', () => {
    const out = formatDateTime('2026-06-03T18:12:00Z');
    expect(out).toMatch(/2026/);
  });
});
