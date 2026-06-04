'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { LoadingState } from '@/components/ui/states';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (isError) {
      router.replace('/login');
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Verificando sessão…" />
      </div>
    );
  }

  if (isError || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-6 md:p-8">
        <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
