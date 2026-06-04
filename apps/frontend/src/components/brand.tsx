import { Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
        <Satellite className="h-5 w-5 text-primary" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Orbit<span className="text-primary">Ham</span>
      </span>
    </div>
  );
}
