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
import { formatDateTime, formatTime, formatElevation } from '@/lib/utils';

type PassRow = Pass & { satellite_name?: string };

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
    <Table>
      <TableHeader>
        <TableRow>
          {showSatellite && <TableHead>Satélite</TableHead>}
          <TableHead>Subida (rise)</TableHead>
          <TableHead>Pico (peak)</TableHead>
          <TableHead>Descida (set)</TableHead>
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
            <TableCell className="font-mono text-xs">
              {formatTime(p.peak)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {formatTime(p.set)}
            </TableCell>
            <TableCell className="text-right font-mono text-primary">
              {formatElevation(p.max_elevation)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
