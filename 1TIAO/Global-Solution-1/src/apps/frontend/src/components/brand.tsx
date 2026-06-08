import { cn } from '@/lib/utils';

export function Brand({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="OrbitHam"
      className={cn('h-9 w-auto select-none', className)}
    />
  );
}
