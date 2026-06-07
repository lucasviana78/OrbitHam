'use client';

import { useState } from 'react';
import { Satellite, RadioTower, Radar } from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { useStations } from '@/hooks/use-stations';
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

export default function DashboardPage() {
  const { data: stations } = useStations();
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  );
  const effectiveStationId = selectedStationId ?? stations?.[0]?.id;
  const { data, isLoading, isError, error } =
    useDashboard(effectiveStationId);

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

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Próximas passagens</CardTitle>
                <CardDescription>
                  Considerando a estação selecionada e satélites ativos.
                </CardDescription>
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
            <CardHeader>
              <CardTitle>Satélites ativos</CardTitle>
              <CardDescription>
                {data.active_satellites.length} em monitoramento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.active_satellites.length === 0 ? (
                <EmptyState message="Nenhum satélite ativo." />
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {data.active_satellites.map((sat) => (
                    <li
                      key={sat.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
                    >
                      <Satellite className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {sat.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          NORAD {sat.norad_id}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
