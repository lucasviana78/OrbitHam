'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginInput, RegisterInput, User } from '@/types';

export const ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Fetches the current session profile. Used by the protected layout to gate
 * access; a thrown ApiError (401) signals the user is not authenticated.
 */
export function useMe(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery<User>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const user = await authService.me();
      setUser(user);
      return user;
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clear();
      queryClient.clear();
    },
  });
}
