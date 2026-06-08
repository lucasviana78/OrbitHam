/** Distinct colours assigned per satellite on the map (cycled when there are more). */
export const SATELLITE_PALETTE = [
  '#facc15', // amber
  '#38bdf8', // sky
  '#f472b6', // pink
  '#4ade80', // green
  '#fb923c', // orange
  '#a78bfa', // violet
  '#22d3ee', // cyan
  '#f87171', // red
];

export const satelliteColor = (index: number): string =>
  SATELLITE_PALETTE[index % SATELLITE_PALETTE.length];
