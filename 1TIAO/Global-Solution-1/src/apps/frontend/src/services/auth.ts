import { apiFetchValidated, apiFetch } from './api';
import {
  userSchema,
  type User,
  type LoginInput,
  type RegisterInput,
} from '@/types';

export const authService = {
  login: (input: LoginInput): Promise<User> =>
    apiFetchValidated('/auth/login', userSchema, {
      method: 'POST',
      body: input,
    }),

  register: (input: RegisterInput): Promise<User> =>
    apiFetchValidated('/auth/register', userSchema, {
      method: 'POST',
      body: input,
    }),

  me: (): Promise<User> => apiFetchValidated('/auth/me', userSchema),

  logout: (): Promise<unknown> =>
    apiFetch('/auth/logout', { method: 'POST' }),
};
