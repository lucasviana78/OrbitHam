import type { Pass } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/states';
import {
  formatDateTime,
  formatTime,
  formatElevation,
  formatDuration,
} from '@/lib/utils';

type PassRow = Pass & { satellite_name?: string };

/** Classify a pass by its peak elevation: higher = better link quality. */
function elevationQuality(deg: number): { color: string; label: string } {
  if (deg >= 45) return { color: '#34d399', label: 'Excelente' };
  if (deg >= 25) return { color: '#facc15', label: 'Média' };
  return { color: '#f87171', label: 'Ruim' };
}

const ELEVATION_LEGEND = [
  { color: '#34d399', label: 'Excelente', range: '≥ 45°' },
  { color: '#facc15', label: 'Média', range: '25–44°' },
  { color: '#f87171', label: 'Ruim', range: '< 25°' },
];

export function PassesTable({
  passes,
  showSatellite = false,
}: {
  passes: PassRow[];
  showSatellite?: boolean;
}) {
  if (passes.length === 0) {
    return <EmptyState message="Nenhuma passagem encontrada." />;
  }

  return (
    <div className="space-y-3">
    <Table>
      <TableHeader>
        <TableRow>
          {showSatellite && <TableHead>Satélite</TableHead>}
          <TableHead>Subida</TableHead>
          <TableHead>Duração</TableHead>
          <TableHead>Pico</TableHead>
          <TableHead>Descida</TableHead>
          <TableHead className="text-right">Elevação máx.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {passes.map((p, i) => (
          <TableRow key={`${p.rise}-${i}`}>
            {showSatellite && (
              <TableCell className="font-medium">
                {p.satellite_name ?? '—'}
              </TableCell>
            )}
            <TableCell className="font-mono text-xs">
              {formatDateTime(p.rise)}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {formatDuration(p.rise, p.set)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {formatTime(p.peak)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {formatTime(p.set)}
            </TableCell>
            <TableCell className="text-right font-mono text-primary">
              {(() => {
                const q = elevationQuality(p.max_elevation);
                return (
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: q.color }}
                      title={`${q.label} (${formatElevation(p.max_elevation)})`}
                      aria-label={q.label}
                    />
                    {formatElevation(p.max_elevation)}
                  </span>
                );
              })()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
        <span className="font-medium">Elevação máx.:</span>
        {ELEVATION_LEGEND.map((tier) => (
          <span key={tier.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tier.color }}
            />
            {tier.label} ({tier.range})
          </span>
        ))}
      </div>
    </div>
  );
}
