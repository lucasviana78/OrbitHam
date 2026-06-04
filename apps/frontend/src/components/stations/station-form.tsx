'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stationFormSchema, type StationFormInput, type Station } from '@/types';
import { useCreateStation, useUpdateStation } from '@/hooks/use-stations';
import { ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError, FormError } from '@/components/ui/field';

interface Props {
  station?: Station;
  onDone: () => void;
  onCancel: () => void;
}

export function StationForm({ station, onDone, onCancel }: Props) {
  const create = useCreateStation();
  const update = useUpdateStation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StationFormInput>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: station
      ? {
          name: station.name,
          callsign: station.callsign,
          latitude: station.latitude,
          longitude: station.longitude,
          altitude: station.altitude,
        }
      : { name: '', callsign: '', latitude: 0, longitude: 0, altitude: 0 },
  });

  const onSubmit = async (values: StationFormInput) => {
    setFormError(null);
    try {
      if (station) {
        await update.mutateAsync({ id: station.id, input: values });
      } else {
        await create.mutateAsync(values);
      }
      onDone();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Não foi possível salvar.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Estação Principal" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="callsign">Indicativo</Label>
          <Input id="callsign" placeholder="PU2ABC" {...register('callsign')} />
          <FieldError message={errors.callsign?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="altitude">Altitude (m)</Label>
          <Input
            id="altitude"
            type="number"
            step="any"
            {...register('altitude')}
          />
          <FieldError message={errors.altitude?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="-23.5"
            {...register('latitude')}
          />
          <FieldError message={errors.latitude?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="-46.6"
            {...register('longitude')}
          />
          <FieldError message={errors.longitude?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : station ? 'Salvar' : 'Criar estação'}
        </Button>
      </div>
    </form>
  );
}
