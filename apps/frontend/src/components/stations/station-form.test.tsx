import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '@/test/utils';

const create = vi.fn();
const update = vi.fn();
vi.mock('@/services/stations', () => ({
  stationsService: {
    list: vi.fn().mockResolvedValue([]),
    create: (i: unknown) => create(i),
    update: (id: number, i: unknown) => update(id, i),
  },
}));

import { StationForm } from './station-form';

const station = {
  id: 1,
  user_id: 1,
  name: 'Base',
  callsign: 'PU2ABC',
  latitude: -23,
  longitude: -46,
  altitude: 700,
};

describe('StationForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a station with coerced numeric values', async () => {
    create.mockResolvedValue(station);
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(
      <StationForm onDone={onDone} onCancel={() => {}} />,
      { wrapper: createWrapper() },
    );

    await user.type(screen.getByLabelText('Nome'), 'Base');
    await user.type(screen.getByLabelText('Indicativo'), 'PU2ABC');
    await user.clear(screen.getByLabelText('Latitude'));
    await user.type(screen.getByLabelText('Latitude'), '-23.5');
    await user.clear(screen.getByLabelText('Longitude'));
    await user.type(screen.getByLabelText('Longitude'), '-46.6');
    await user.clear(screen.getByLabelText('Altitude (m)'));
    await user.type(screen.getByLabelText('Altitude (m)'), '760');

    await user.click(screen.getByRole('button', { name: /criar estação/i }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: 'Base',
        callsign: 'PU2ABC',
        latitude: -23.5,
        longitude: -46.6,
        altitude: 760,
      }),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it('pre-fills fields and calls update when editing', async () => {
    update.mockResolvedValue(station);
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(
      <StationForm station={station} onDone={onDone} onCancel={() => {}} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByLabelText('Indicativo')).toHaveValue('PU2ABC');

    await user.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0]).toBe(1);
  });

  it('shows validation errors for out-of-range latitude', async () => {
    const user = userEvent.setup();
    render(
      <StationForm onDone={() => {}} onCancel={() => {}} />,
      { wrapper: createWrapper() },
    );
    await user.type(screen.getByLabelText('Nome'), 'X');
    await user.type(screen.getByLabelText('Indicativo'), 'PU2ABC');
    await user.clear(screen.getByLabelText('Latitude'));
    await user.type(screen.getByLabelText('Latitude'), '120');
    await user.click(screen.getByRole('button', { name: /criar estação/i }));

    expect(await screen.findByText('Max 90')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
