'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStations, useDeleteStation } from '@/hooks/use-stations';
import type { Station } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { StationForm } from '@/components/stations/station-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui/states';

export default function StationsPage() {
  const { data, isLoading, isError, error } = useStations();
  const remove = useDeleteStation();
  const [editing, setEditing] = useState<Station | null>(null);
  const [creating, setCreating] = useState(false);

  const showForm = creating || editing !== null;

  const handleDelete = async (station: Station) => {
    if (!window.confirm(`Excluir a estação "${station.name}"?`)) return;
    await remove.mutateAsync(station.id);
  };

  return (
    <div>
      <PageHeader
        title="Estações"
        description="Gerencie suas estações terrestres."
        action={
          !showForm && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Nova estação
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editing ? 'Editar estação' : 'Nova estação'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StationForm
              station={editing ?? undefined}
              onDone={() => {
                setEditing(null);
                setCreating(false);
              }}
              onCancel={() => {
                setEditing(null);
                setCreating(false);
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading && <LoadingState />}
          {isError && <ErrorState message={(error as Error)?.message} />}
          {data && data.length === 0 && (
            <EmptyState message="Você ainda não cadastrou estações." />
          )}
          {data && data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Indicativo</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead>Altitude</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">
                      {station.name}
                    </TableCell>
                    <TableCell className="font-mono">
                      {station.callsign}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {station.latitude}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {station.longitude}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {station.altitude} m
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setCreating(false);
                            setEditing(station);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir"
                          className="text-destructive hover:text-destructive"
                          disabled={remove.isPending}
                          onClick={() => handleDelete(station)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
