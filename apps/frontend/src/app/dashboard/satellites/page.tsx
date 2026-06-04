'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useSatellites } from '@/hooks/use-satellites';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
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

export default function SatellitesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error } = useSatellites(
    search.trim() || undefined,
  );

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
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <LoadingState />}
          {isError && <ErrorState message={(error as Error)?.message} />}
          {data && data.length === 0 && (
            <EmptyState message="Nenhum satélite encontrado." />
          )}
          {data && data.length > 0 && (
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
                {data.map((sat) => (
                  <TableRow key={sat.id}>
                    <TableCell className="font-medium">{sat.name}</TableCell>
                    <TableCell className="font-mono">{sat.norad_id}</TableCell>
                    <TableCell>{sat.category || '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {sat.status || 'desconhecido'}
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
    </div>
  );
}
