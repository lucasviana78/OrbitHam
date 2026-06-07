'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  RadioTower,
  Satellite,
  Globe2,
  LogOut,
} from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/stations', label: 'Estações', icon: RadioTower },
  { href: '/dashboard/satellites', label: 'Satélites', icon: Satellite },
  { href: '/dashboard/tracking', label: 'Mapa', icon: Globe2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      router.push('/login');
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card/60 backdrop-blur-sm">
      <div className="px-5 py-6">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {user && (
          <div className="mb-2 px-2 text-xs text-muted-foreground">
            <p className="truncate font-medium text-foreground">
              {user.username}
            </p>
            <p className="truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </Button>
      </div>
    </aside>
  );
}
