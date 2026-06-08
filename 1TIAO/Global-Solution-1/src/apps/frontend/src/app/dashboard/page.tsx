'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Satellite,
  RadioTower,
  Radar,
  Globe2,
  Gauge,
  Mountain,
  MapPin,
  Ruler,
  Timer,
  X,
} from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { useStations } from '@/hooks/use-stations';
import { useSatellites } from '@/hooks/use-satellites';
import { usePasses } from '@/hooks/use-passes';
import { satelliteColor } from '@/lib/satellite-colors';
import { cn, formatDateTime } from '@/lib/utils';
import { AntennaPointing } from '@/components/tracking/antenna-pointing';
import type { DashboardPass } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { PassesTable } from '@/components/passes-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states';
import type { SatState } from '@/lib/orbital';

const ISS_NORAD = 25544;

// MapLibre touches the DOM/WebGL, so load it only in the browser.
const SatelliteMap = dynamic(
  () =>
    import('@/components/tracking/satellite-map').then((m) => m.SatelliteMap),
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
    {
      icon: Ruler,
      label: 'Distância',
      value:
        state?.rangeKm != null
          ? `${Math.round(state.rangeKm).toLocaleString('pt-BR')} km`
          : '—',
      title:
        state?.elevationDeg != null
          ? state.elevationDeg >= 0
            ? `Elevação ${state.elevationDeg.toFixed(1)}°`
            : 'Abaixo do horizonte'
          : undefined,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ icon: Icon, label, value, title }) => (
        <div
          key={label}
          className="rounded-md border border-border bg-card/60 p-3"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
          <p
            className="mt-1 font-mono text-sm text-foreground"
            title={title}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Satellite;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </span>
      </CardContent>
    </Card>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Live countdown to the next (or in-progress) pass over the selected station. */
function NextPassCountdown({
  passes,
  stationLabel,
}: {
  passes: DashboardPass[];
  stationLabel?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // First pass that hasn't ended yet (covers a pass currently in progress).
  const upcoming = passes.find((p) => new Date(p.set).getTime() > now);

  let label = 'Próxima passagem';
  let value = 'Sem passagens previstas';
  let detail = 'Aumente a janela de dias ou confira a estação selecionada.';

  if (upcoming) {
    const riseMs = new Date(upcoming.rise).getTime();
    const setMs = new Date(upcoming.set).getTime();
    const inProgress = now >= riseMs;
    const totalSec = Math.max(
      0,
      Math.floor(((inProgress ? setMs : riseMs) - now) / 1000),
    );
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    label = inProgress
      ? 'Passagem em andamento, termina em'
      : 'Próxima passagem em';
    value = `${d > 0 ? `${d}d ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
    detail = `${upcoming.satellite_name}${
      stationLabel ? ` sobre ${stationLabel}` : ''
    } · ${formatDateTime(upcoming.rise)}`;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              'mt-1 font-semibold tabular-nums',
              upcoming ? 'font-mono text-4xl text-primary' : 'text-2xl',
            )}
          >
            {value}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {detail}
          </p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <Timer className="h-6 w-6 text-primary" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stations } = useStations();
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  );
  const [days, setDays] = useState(1);
  const effectiveStationId = selectedStationId ?? stations?.[0]?.id;
  const { data, isLoading, isError, error } = useDashboard(
    effectiveStationId,
    days,
  );

  // Live map: render one or more satellites over the selected station.
  const satellites = useSatellites();
  // null = follow the default (next-pass satellite); array = explicit choice.
  const [selectedSatelliteIds, setSelectedSatelliteIds] = useState<
    number[] | null
  >(null);
  const [satState, setSatState] = useState<SatState | null>(null);

  const satList = satellites.data;

  // Default = the satellite closest to passing over the selected station
  // (first of next_passes), falling back to the ISS / first catalogue entry.
  const defaultSatelliteId = useMemo(() => {
    const nextPassId = data?.next_passes[0]?.satellite_id;
    if (nextPassId != null && satList?.some((s) => s.id === nextPassId))
      return nextPassId;
    if (!satList?.length) return undefined;
    const iss = satList.find((s) => s.norad_id === ISS_NORAD);
    return (iss ?? satList[0]).id;
  }, [data, satList]);

  const effectiveSatelliteIds = useMemo(
    () =>
      selectedSatelliteIds ??
      (defaultSatelliteId != null ? [defaultSatelliteId] : []),
    [selectedSatelliteIds, defaultSatelliteId],
  );

  const selectedSatellites = useMemo(
    () =>
      effectiveSatelliteIds
        .map((id) => satList?.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [effectiveSatelliteIds, satList],
  );

  const addSatellite = (id: number) =>
    setSelectedSatelliteIds((prev) => {
      const base = prev ?? effectiveSatelliteIds;
      return base.includes(id) ? base : [...base, id];
    });
  const removeSatellite = (id: number) =>
    setSelectedSatelliteIds((prev) =>
      (prev ?? effectiveSatelliteIds).filter((x) => x !== id),
    );

  // Rise/set markers follow the primary (first) satellite.
  const passes = usePasses({
    satellite_id: effectiveSatelliteIds[0],
    station_id: effectiveStationId,
    days: 3,
  });

  const selectedStation = stations?.find((s) => s.id === effectiveStationId);
  const stationLabel = selectedStation
    ? `${selectedStation.name} (${selectedStation.callsign})`
    : undefined;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua estação terrestre."
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={(error as Error)?.message} />}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Satélites ativos"
              value={data.active_satellites_count}
              icon={Satellite}
            />
            <StatCard
              title="Total de estações"
              value={data.total_stations}
              icon={RadioTower}
            />
            <StatCard
              title="Próximas passagens"
              value={data.next_passes.length}
              icon={Radar}
            />
          </div>

          <NextPassCountdown
            passes={data.next_passes}
            stationLabel={stationLabel}
          />

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>Próximas passagens</CardTitle>
                <CardDescription>
                  Considerando a estação selecionada e satélites ativos.
                </CardDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Nos próximos</span>
                  <Select
                    id="dashboard-days"
                    aria-label="Quantidade de dias"
                    className="w-16"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                  <span>{days === 1 ? 'dia' : 'dias'}</span>
                </div>
              </div>
              {stations && stations.length > 0 && (
                <div className="w-full max-w-[16rem] space-y-1.5">
                  <Label htmlFor="dashboard-station">Estação</Label>
                  <Select
                    id="dashboard-station"
                    value={effectiveStationId ?? ''}
                    onChange={(e) =>
                      setSelectedStationId(Number(e.target.value))
                    }
                  >
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.callsign})
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <PassesTable passes={data.next_passes} showSatellite />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Mapa em tempo real</CardTitle>
                <CardDescription>
                  Rastreamento orbital ao vivo: trajetória, área de cobertura
                  e dia/noite (SGP4 no navegador).
                </CardDescription>
              </div>
              <div className="w-full max-w-[16rem] space-y-1.5">
                <Label htmlFor="dashboard-satellite">Adicionar satélite</Label>
                <Select
                  id="dashboard-satellite"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addSatellite(Number(e.target.value));
                  }}
                  disabled={!satList?.length}
                >
                  <option value="">
                    {satList?.length ? 'Selecione…' : 'Carregando…'}
                  </option>
                  {satList
                    ?.filter((s) => !effectiveSatelliteIds.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSatellites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSatellites.map((s, i) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 py-1 pl-2.5 pr-1.5 text-xs"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: satelliteColor(i) }}
                      />
                      {s.name}
                      <button
                        type="button"
                        aria-label={`Remover ${s.name}`}
                        onClick={() => removeSatellite(s.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedSatellites.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Telemetria de{' '}
                  <span className="font-medium text-foreground">
                    {selectedSatellites[0].name}
                  </span>
                </p>
              )}
              <Telemetry state={satState} />
              {satellites.isLoading && (
                <LoadingState label="Carregando satélites…" />
              )}
              {!satellites.isLoading &&
                (!satList || satList.length === 0) && (
                  <EmptyState message="Nenhum satélite disponível para rastrear." />
                )}
              {satList && satList.length > 0 && (
                <>
                  {selectedSatellites.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Selecione ao menos um satélite acima para exibir no mapa.
                    </p>
                  )}
                  <div className="h-[60vh] min-h-[420px] w-full overflow-hidden rounded-lg">
                    <SatelliteMap
                      satellites={selectedSatellites}
                      stations={stations ?? []}
                      passes={passes.data}
                      observer={selectedStation}
                      onState={setSatState}
                    />
                  </div>
                </>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 bg-[#facc15]" />{' '}
                  Trajetória
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border border-[#38bdf8] bg-[#38bdf8]/20" />{' '}
                  Cobertura
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#f87171]" />{' '}
                  Estação
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5" /> Atualização a cada 1s
                </span>
              </div>
            </CardContent>
          </Card>

          {selectedSatellites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Apontamento da antena</CardTitle>
                <CardDescription>
                  Para onde apontar a antena na próxima passagem de{' '}
                  <span className="font-medium text-foreground">
                    {selectedSatellites[0].name}
                  </span>
                  {stationLabel ? ` em ${stationLabel}` : ''}: azimute, elevação
                  e o trajeto pelo céu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AntennaPointing
                  satellite={selectedSatellites[0]}
                  observer={selectedStation}
                  pass={passes.data?.[0]}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
