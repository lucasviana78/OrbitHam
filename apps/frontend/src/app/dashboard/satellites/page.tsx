'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSatellites } from '@/hooks/use-satellites';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui/states';

const PAGE_SIZE = 15;

// Backend stores status/category in English; show them in Portuguese.
const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  decayed: 'Reentrou',
  unknown: 'Desconhecido',
};
const CATEGORY_LABELS: Record<string, string> = {
  amateur: 'Radioamador',
  stations: 'Estações',
};

const labelFor = (
  value: string | null | undefined,
  map: Record<string, string>,
  fallback: string,
): string => {
  if (!value) return fallback;
  return map[value.toLowerCase()] ?? value;
};

export default function SatellitesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useSatellites(
    search.trim() || undefined,
  );

  // Sort by name (the API already does, but keep the intent explicit).
  const sorted = useMemo(
    () =>
      data
        ? [...data].sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
          )
        : [],
    [data],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Keep the current page within bounds when the result set changes.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Satélites"
        description="Catálogo de satélites e seus TLEs."
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <LoadingState />}
          {isError && <ErrorState message={(error as Error)?.message} />}
          {data && sorted.length === 0 && (
            <EmptyState message="Nenhum satélite encontrado." />
          )}
          {sorted.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>NORAD</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((sat) => (
                  <TableRow key={sat.id}>
                    <TableCell className="font-medium">{sat.name}</TableCell>
                    <TableCell className="font-mono">{sat.norad_id}</TableCell>
                    <TableCell>
                      {labelFor(sat.category, CATEGORY_LABELS, '—')}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {labelFor(sat.status, STATUS_LABELS, 'Desconhecido')}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {sat.updated_at ? formatDateTime(sat.updated_at) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {sorted.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            {start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} de{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="tabular-nums">
              Página {safePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
