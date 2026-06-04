'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Globe2, Gauge, Mountain, MapPin } from 'lucide-react';
import { useSatellites } from '@/hooks/use-satellites';
import { useStations } from '@/hooks/use-stations';
import { usePasses } from '@/hooks/use-passes';
import { PageHeader } from '@/components/layout/page-header';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState, EmptyState } from '@/components/ui/states';
import type { SatState } from '@/lib/orbital';

const ISS_NORAD = 25544;

// MapLibre touches the DOM/WebGL — load it only in the browser.
const SatelliteMap = dynamic(
  () => import('@/components/tracking/satellite-map').then((m) => m.SatelliteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <LoadingState label="Carregando mapa…" />
      </div>
    ),
  },
);

function Telemetry({ state }: { state: SatState | null }) {
  const items = [
    {
      icon: MapPin,
      label: 'Posição',
      value: state
        ? `${state.lat.toFixed(2)}°, ${state.lon.toFixed(2)}°`
        : '—',
    },
    {
      icon: Mountain,
      label: 'Altitude',
      value: state ? `${state.altitudeKm.toFixed(0)} km` : '—',
    },
    {
      icon: Gauge,
      label: 'Velocidade',
      value: state ? `${(state.velocityKmS * 3600).toFixed(0)} km/h` : '—',
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-md border border-border bg-card/60 p-3"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
          <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function TrackingPage() {
  const satellites = useSatellites();
  const stations = useStations();
  const [satelliteId, setSatelliteId] = useState<number | undefined>();
  const [state, setState] = useState<SatState | null>(null);

  // Default to the ISS once the catalogue loads.
  const list = satellites.data;
  const effectiveId = useMemo(() => {
    if (satelliteId != null) return satelliteId;
    if (!list?.length) return undefined;
    const iss = list.find((s) => s.norad_id === ISS_NORAD);
    return (iss ?? list[0]).id;
  }, [satelliteId, list]);

  const selected = list?.find((s) => s.id === effectiveId);
  const firstStation = stations.data?.[0];

  const passes = usePasses({
    satellite_id: effectiveId,
    station_id: firstStation?.id,
    days: 3,
  });

  return (
    <div>
      <PageHeader
        title="Mapa em Tempo Real"
        description="Rastreamento orbital ao vivo: trajetória, footprint e dia/noite (SGP4 no navegador)."
      />

      <Card className="mb-4">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sat">Satélite</Label>
            <Select
              id="sat"
              value={effectiveId ?? ''}
              onChange={(e) =>
                setSatelliteId(e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={!list?.length}
            >
              {!list?.length && <option value="">Carregando…</option>}
              {list?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Telemetry state={state} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {satellites.isLoading && <LoadingState label="Carregando satélites…" />}
          {!satellites.isLoading && !selected && (
            <EmptyState message="Nenhum satélite disponível para rastrear." />
          )}
          {selected && (
            <div className="h-[68vh] min-h-[460px] w-full overflow-hidden rounded-b-lg">
              <SatelliteMap
                satellite={selected}
                stations={stations.data ?? []}
                passes={passes.data}
                onState={setState}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-[#facc15]" /> Trajetória
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-[#38bdf8] bg-[#38bdf8]/20" />{' '}
          Footprint
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#f87171]" /> Estação
        </span>
        <span className="flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5" /> Atualização a cada 1s
        </span>
      </div>
    </div>
  );
}
