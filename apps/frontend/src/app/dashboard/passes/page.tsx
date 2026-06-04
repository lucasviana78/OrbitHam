'use client';

import { useState } from 'react';
import { Radar } from 'lucide-react';
import { useStations } from '@/hooks/use-stations';
import { useSatellites } from '@/hooks/use-satellites';
import { usePasses } from '@/hooks/use-passes';
import { PageHeader } from '@/components/layout/page-header';
import { PassesTable } from '@/components/passes-table';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui/states';

export default function PassesPage() {
  const stations = useStations();
  const satellites = useSatellites();
  const [stationId, setStationId] = useState<number | undefined>();
  const [satelliteId, setSatelliteId] = useState<number | undefined>();
  const [days, setDays] = useState(3);

  const passes = usePasses({
    station_id: stationId,
    satellite_id: satelliteId,
    days,
  });

  const ready = stationId != null && satelliteId != null;

  return (
    <div>
      <PageHeader
        title="Passagens"
        description="Calcule as próximas passagens de um satélite sobre uma estação."
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="station">Estação</Label>
            <Select
              id="station"
              value={stationId ?? ''}
              onChange={(e) =>
                setStationId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Selecione…</option>
              {stations.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.callsign})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="satellite">Satélite</Label>
            <Select
              id="satellite"
              value={satelliteId ?? ''}
              onChange={(e) =>
                setSatelliteId(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            >
              <option value="">Selecione…</option>
              {satellites.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="days">Dias (1-10)</Label>
            <Select
              id="days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!ready && (
            <EmptyState message="Selecione uma estação e um satélite para calcular as passagens." />
          )}
          {ready && passes.isLoading && (
            <LoadingState label="Calculando passagens…" />
          )}
          {ready && passes.isError && (
            <ErrorState message={(passes.error as Error)?.message} />
          )}
          {ready && passes.data && <PassesTable passes={passes.data} />}
        </CardContent>
      </Card>

      {!ready && stations.data?.length === 0 && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Radar className="h-4 w-4" />
          Cadastre uma estação primeiro para calcular passagens.
        </p>
      )}
    </div>
  );
}
