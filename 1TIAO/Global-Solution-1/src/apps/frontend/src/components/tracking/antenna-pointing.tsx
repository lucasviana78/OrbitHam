'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Satellite, Station, Pass } from '@/types';
import { parseTle, propagateAt, type SatState } from '@/lib/orbital';
import { useSetSatelliteFrequency } from '@/hooks/use-satellites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_FREQ_MHZ = '145.800';

/* ---- sky-plot geometry (azimuth/elevation polar projection) ---- */
const CX = 100;
const CY = 100;
const R = 82; // outer ring (horizon) radius; leaves room for N/L/S/O labels

/** Speed of light in km/s, used for the Doppler shift. */
const C_KM_S = 299792.458;

/** Project an azimuth/elevation pair onto the polar plot. */
function polar(azDeg: number, elDeg: number): { x: number; y: number } {
  const el = Math.max(0, Math.min(90, elDeg));
  const r = R * (1 - el / 90); // 90° (zenith) → centre, 0° (horizon) → edge
  const a = (azDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

const CARDINALS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
function cardinal(azDeg: number): string {
  const idx = Math.round((((azDeg % 360) + 360) % 360) / 45) % 8;
  return CARDINALS[idx];
}

const round = (n: number) => Math.round(n);

function observerOf(station?: Station) {
  if (!station) return undefined;
  return {
    latitude: station.latitude,
    longitude: station.longitude,
    altitudeKm: station.altitude / 1000,
  };
}

/** A compass dial with a needle pointing to the antenna heading. */
function CompassDial({ azimuth }: { azimuth?: number }) {
  const size = 76;
  const c = size / 2;
  const r = 30;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-[76px] w-[76px] shrink-0"
      role="img"
      aria-label="Bússola de azimute"
    >
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="rgba(2,6,23,0.4)"
        stroke="rgba(148,163,184,0.4)"
        strokeWidth={1}
      />
      <text x={c} y={11} textAnchor="middle" fontSize={8} fill="#94a3b8">N</text>
      <text x={c} y={size - 3} textAnchor="middle" fontSize={7} fill="#64748b">S</text>
      <text x={size - 4} y={c + 3} textAnchor="middle" fontSize={7} fill="#64748b">L</text>
      <text x={4} y={c + 3} textAnchor="middle" fontSize={7} fill="#64748b">O</text>
      {azimuth != null && (
        <g transform={`rotate(${azimuth} ${c} ${c})`}>
          <polygon
            points={`${c},${c - r + 4} ${c - 4},${c + 6} ${c + 4},${c + 6}`}
            fill="#facc15"
          />
          <circle cx={c} cy={c} r={2} fill="#facc15" />
        </g>
      )}
    </svg>
  );
}

export function AntennaPointing({
  satellite,
  observer,
  pass,
}: {
  satellite?: Satellite;
  observer?: Station;
  pass?: Pass;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Frequency: seeded from the satellite's saved value, persisted on demand.
  const storedMhz = satellite?.downlink_mhz ?? null;
  const [freqMhz, setFreqMhz] = useState(() =>
    storedMhz != null ? String(storedMhz) : DEFAULT_FREQ_MHZ,
  );
  useEffect(() => {
    setFreqMhz(storedMhz != null ? String(storedMhz) : DEFAULT_FREQ_MHZ);
  }, [satellite?.id, storedMhz]);

  const setFrequency = useSetSatelliteFrequency();
  const parsedFreq = Number(freqMhz.replace(',', '.'));
  const freqValid = Number.isFinite(parsedFreq) && parsedFreq > 0;
  const valueToSave = freqValid ? parsedFreq : null;
  const dirty = satellite != null && valueToSave !== storedMhz;
  const saveFrequency = () => {
    if (!satellite || !dirty) return;
    setFrequency.mutate({ id: satellite.id, downlinkMhz: valueToSave });
  };

  const satrec = useMemo(() => {
    if (!satellite?.tle_1 || !satellite?.tle_2) return null;
    try {
      return parseTle(satellite.tle_1, satellite.tle_2);
    } catch {
      return null;
    }
  }, [satellite?.tle_1, satellite?.tle_2]);

  // The pass arc (rise → set) sampled in azimuth/elevation, projected to points.
  const arc = useMemo(() => {
    const o = observerOf(observer);
    if (!satrec || !o || !pass) return [] as { x: number; y: number }[];
    const riseMs = new Date(pass.rise).getTime();
    const setMs = new Date(pass.set).getTime();
    if (!(setMs > riseMs)) return [];
    const steps = 72;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = new Date(riseMs + ((setMs - riseMs) * i) / steps);
      const s = propagateAt(satrec, t, o);
      if (s?.elevationDeg != null && s.azimuthDeg != null && s.elevationDeg >= -1)
        pts.push(polar(s.azimuthDeg, s.elevationDeg));
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satrec, observer?.latitude, observer?.longitude, observer?.altitude, pass?.rise, pass?.set]);

  const riseLook = useMemo<SatState | null>(() => {
    const o = observerOf(observer);
    if (!satrec || !o || !pass) return null;
    return propagateAt(satrec, new Date(pass.rise), o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satrec, observer?.latitude, observer?.longitude, observer?.altitude, pass?.rise]);

  const setLook = useMemo<SatState | null>(() => {
    const o = observerOf(observer);
    if (!satrec || !o || !pass) return null;
    return propagateAt(satrec, new Date(pass.set), o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satrec, observer?.latitude, observer?.longitude, observer?.altitude, pass?.set]);

  const live = useMemo<SatState | null>(() => {
    const o = observerOf(observer);
    if (!satrec || !o) return null;
    return propagateAt(satrec, new Date(now), o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satrec, observer?.latitude, observer?.longitude, observer?.altitude, now]);

  const visible = live?.elevationDeg != null && live.elevationDeg >= 0;
  const livePt =
    visible && live?.azimuthDeg != null
      ? polar(live.azimuthDeg, live.elevationDeg!)
      : null;
  const risePt =
    riseLook?.azimuthDeg != null ? polar(riseLook.azimuthDeg, 0) : null;
  const setPt =
    setLook?.azimuthDeg != null ? polar(setLook.azimuthDeg, 0) : null;

  // Heading the antenna should aim at: live when up, otherwise where it rises.
  const aimAz = visible
    ? live?.azimuthDeg
    : (riseLook?.azimuthDeg ?? undefined);

  // Doppler: shift the configured frequency by the radial (range) rate.
  const freqHz = (Number(freqMhz.replace(',', '.')) || 0) * 1e6;
  let doppler: { tunedMhz: number; deltaKhz: number; when: string } | null =
    null;
  const obs = observerOf(observer);
  if (satrec && obs && freqHz > 0) {
    const t = visible ? new Date(now) : pass ? new Date(pass.rise) : null;
    if (t) {
      const a = propagateAt(satrec, t, obs);
      const b = propagateAt(satrec, new Date(t.getTime() + 1000), obs);
      if (a?.rangeKm != null && b?.rangeKm != null) {
        const rangeRate = b.rangeKm - a.rangeKm; // km/s (approaching < 0)
        const shiftHz = -freqHz * (rangeRate / C_KM_S);
        doppler = {
          tunedMhz: (freqHz + shiftHz) / 1e6,
          deltaKhz: shiftHz / 1e3,
          when: visible ? 'agora' : 'no AOS',
        };
      }
    }
  }

  // Panel values.
  let azText = '—';
  let elText = '—';
  let status = 'Sem dados de apontamento.';
  let statusVisible = false;
  if (!observer) {
    status = 'Selecione uma estação para calcular o apontamento.';
  } else if (!satrec) {
    status = 'TLE indisponível para este satélite.';
  } else if (visible && live) {
    azText = `${round(live.azimuthDeg!)}° (${cardinal(live.azimuthDeg!)})`;
    elText = `${round(live.elevationDeg!)}°`;
    status = 'Visível agora, aponte a antena.';
    statusVisible = true;
  } else if (riseLook?.azimuthDeg != null) {
    status = `Aguardando. Nascerá a ${cardinal(riseLook.azimuthDeg)} (AZ ${round(
      riseLook.azimuthDeg,
    )}°).`;
  } else {
    status = 'Sem passagem prevista na janela.';
  }

  const rings = [
    { el: 0, label: '0°' },
    { el: 30, label: '30°' },
    { el: 60, label: '60°' },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <svg
        viewBox="0 0 200 200"
        className="h-52 w-52 shrink-0"
        role="img"
        aria-label="Gráfico polar do céu (azimute e elevação)"
      >
        {rings.map((ring) => (
          <circle
            key={ring.el}
            cx={CX}
            cy={CY}
            r={R * (1 - ring.el / 90)}
            fill={ring.el === 0 ? 'rgba(56,189,248,0.04)' : 'none'}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth={0.7}
          />
        ))}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="rgba(148,163,184,0.25)" strokeWidth={0.5} />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="rgba(148,163,184,0.25)" strokeWidth={0.5} />

        <text x={CX} y={11} textAnchor="middle" fontSize={9} fill="#94a3b8">N</text>
        <text x={CX} y={197} textAnchor="middle" fontSize={9} fill="#94a3b8">S</text>
        <text x={193} y={103} textAnchor="middle" fontSize={9} fill="#94a3b8">L</text>
        <text x={7} y={103} textAnchor="middle" fontSize={9} fill="#94a3b8">O</text>
        {rings.map((ring) => (
          <text
            key={ring.el}
            x={CX + 2}
            y={CY - R * (1 - ring.el / 90) + 8}
            fontSize={6}
            fill="rgba(148,163,184,0.7)"
          >
            {ring.label}
          </text>
        ))}

        {arc.length > 1 && (
          <polyline
            points={arc.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#facc15"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {risePt && <circle cx={risePt.x} cy={risePt.y} r={3} fill="#34d399" />}
        {setPt && <circle cx={setPt.x} cy={setPt.y} r={3} fill="#fb923c" />}

        {livePt && (
          <>
            <circle cx={livePt.x} cy={livePt.y} r={7} fill="rgba(250,204,21,0.25)" />
            <circle cx={livePt.x} cy={livePt.y} r={3.5} fill="#facc15" stroke="#0b1020" strokeWidth={0.8} />
          </>
        )}
      </svg>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <CompassDial azimuth={aimAz} />
            <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {aimAz != null ? `${round(aimAz)}° ${cardinal(aimAz)}` : '—'}
            </span>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-card/60 p-3">
              <p className="text-xs text-muted-foreground">Azimute</p>
              <p className="mt-1 font-mono text-lg text-foreground">{azText}</p>
            </div>
            <div className="rounded-md border border-border bg-card/60 p-3">
              <p className="text-xs text-muted-foreground">Elevação</p>
              <p className="mt-1 font-mono text-lg text-foreground">{elText}</p>
            </div>
          </div>
        </div>

        <p
          className={
            statusVisible
              ? 'flex items-center gap-2 text-sm font-medium text-primary'
              : 'flex items-center gap-2 text-sm text-muted-foreground'
          }
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: statusVisible ? '#34d399' : '#94a3b8' }}
          />
          {status}
        </p>

        {/* Doppler */}
        <div className="rounded-md border border-border bg-card/60 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="doppler-freq" className="text-xs">
                Frequência (MHz)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="doppler-freq"
                  type="number"
                  step="0.001"
                  inputMode="decimal"
                  value={freqMhz}
                  onChange={(e) => setFreqMhz(e.target.value)}
                  className="h-9 w-32 font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={saveFrequency}
                  disabled={!dirty || !freqValid || setFrequency.isPending}
                >
                  {setFrequency.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
              <p className="h-3 text-[11px] text-muted-foreground">
                {setFrequency.isError
                  ? 'Erro ao salvar.'
                  : dirty
                    ? 'Não salvo.'
                    : storedMhz != null
                      ? 'Salvo para este satélite.'
                      : ''}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Sintonize ({doppler?.when ?? '—'})
              </p>
              <p className="mt-1 font-mono text-lg text-foreground">
                {doppler ? `${doppler.tunedMhz.toFixed(4)} MHz` : '—'}
                {doppler && (
                  <span
                    className={
                      doppler.deltaKhz >= 0
                        ? 'ml-2 text-sm text-[#34d399]'
                        : 'ml-2 text-sm text-[#fb923c]'
                    }
                  >
                    {doppler.deltaKhz >= 0 ? '+' : ''}
                    {doppler.deltaKhz.toFixed(1)} kHz
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-[#facc15]" /> Trajeto no céu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#34d399]" /> Subida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#fb923c]" /> Descida
          </span>
        </div>
      </div>
    </div>
  );
}
