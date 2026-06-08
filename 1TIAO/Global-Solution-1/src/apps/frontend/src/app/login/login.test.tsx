import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWrapper } from '@/test/utils';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const loginMock = vi.fn();
vi.mock('@/services/auth', () => ({
  authService: {
    login: (input: unknown) => loginMock(input),
  },
}));

import LoginPage from './page';

describe('LoginPage', () => {
  beforeEach(() => {
    push.mockClear();
    loginMock.mockClear();
  });

  it('renders email and password fields', () => {
    render(<LoginPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('submits valid credentials and redirects to /dashboard', async () => {
    loginMock.mockResolvedValue({ id: 1, email: 'a@b.com', username: 'neo' });
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await user.type(screen.getByLabelText('Senha'), 'secret123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'secret123',
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });

  it('displays an error message when login fails', async () => {
    const { ApiError } = await import('@/services/api');
    loginMock.mockRejectedValue(new ApiError('Credenciais inválidas', 401));
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await user.type(screen.getByLabelText('Senha'), 'wrong');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(
      await screen.findByText('Credenciais inválidas'),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
