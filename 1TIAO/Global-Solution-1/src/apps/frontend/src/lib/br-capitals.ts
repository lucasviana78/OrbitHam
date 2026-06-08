/**
 * Brazilian state capitals grouped by region, for quick-filling a station's
 * coordinates. Latitude/longitude are city-centre approximations; altitude is
 * in metres. Users can refine the values after picking one.
 */
export interface Capital {
  city: string;
  uf: string;
  lat: number;
  lon: number;
  altitude: number;
}

export interface CapitalRegion {
  region: string;
  capitals: Capital[];
}

export const BR_CAPITALS: CapitalRegion[] = [
  {
    region: 'Norte',
    capitals: [
      { city: 'Manaus', uf: 'AM', lat: -3.119, lon: -60.0217, altitude: 92 },
      { city: 'Belém', uf: 'PA', lat: -1.4558, lon: -48.5039, altitude: 10 },
      { city: 'Porto Velho', uf: 'RO', lat: -8.7619, lon: -63.9039, altitude: 85 },
      { city: 'Rio Branco', uf: 'AC', lat: -9.974, lon: -67.8076, altitude: 153 },
      { city: 'Boa Vista', uf: 'RR', lat: 2.8235, lon: -60.6758, altitude: 90 },
      { city: 'Macapá', uf: 'AP', lat: 0.0349, lon: -51.0694, altitude: 14 },
      { city: 'Palmas', uf: 'TO', lat: -10.184, lon: -48.3336, altitude: 230 },
    ],
  },
  {
    region: 'Nordeste',
    capitals: [
      { city: 'Salvador', uf: 'BA', lat: -12.9714, lon: -38.5014, altitude: 8 },
      { city: 'Recife', uf: 'PE', lat: -8.0476, lon: -34.877, altitude: 4 },
      { city: 'Fortaleza', uf: 'CE', lat: -3.7319, lon: -38.5267, altitude: 16 },
      { city: 'Natal', uf: 'RN', lat: -5.7945, lon: -35.211, altitude: 30 },
      { city: 'João Pessoa', uf: 'PB', lat: -7.1195, lon: -34.845, altitude: 37 },
      { city: 'Maceió', uf: 'AL', lat: -9.6498, lon: -35.7089, altitude: 16 },
      { city: 'Aracaju', uf: 'SE', lat: -10.9472, lon: -37.0731, altitude: 4 },
      { city: 'Teresina', uf: 'PI', lat: -5.0892, lon: -42.8019, altitude: 72 },
      { city: 'São Luís', uf: 'MA', lat: -2.5307, lon: -44.3068, altitude: 24 },
    ],
  },
  {
    region: 'Centro-Oeste',
    capitals: [
      { city: 'Brasília', uf: 'DF', lat: -15.7939, lon: -47.8828, altitude: 1172 },
      { city: 'Goiânia', uf: 'GO', lat: -16.6869, lon: -49.2648, altitude: 749 },
      { city: 'Cuiabá', uf: 'MT', lat: -15.6014, lon: -56.0979, altitude: 165 },
      { city: 'Campo Grande', uf: 'MS', lat: -20.4697, lon: -54.6201, altitude: 592 },
    ],
  },
  {
    region: 'Sudeste',
    capitals: [
      { city: 'São Paulo', uf: 'SP', lat: -23.5505, lon: -46.6333, altitude: 760 },
      { city: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lon: -43.1729, altitude: 2 },
      { city: 'Belo Horizonte', uf: 'MG', lat: -19.9167, lon: -43.9345, altitude: 852 },
      { city: 'Vitória', uf: 'ES', lat: -20.3155, lon: -40.3128, altitude: 3 },
    ],
  },
  {
    region: 'Sul',
    capitals: [
      { city: 'Curitiba', uf: 'PR', lat: -25.4284, lon: -49.2733, altitude: 934 },
      { city: 'Florianópolis', uf: 'SC', lat: -27.5949, lon: -48.5482, altitude: 3 },
      { city: 'Porto Alegre', uf: 'RS', lat: -30.0346, lon: -51.2177, altitude: 10 },
    ],
  },
];

/** Flat lookup by UF (each capital has a unique state code). */
export const CAPITAL_BY_UF: Record<string, Capital> = Object.fromEntries(
  BR_CAPITALS.flatMap((g) => g.capitals).map((c) => [c.uf, c]),
);
