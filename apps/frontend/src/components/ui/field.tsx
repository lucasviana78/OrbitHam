import { cn } from '@/lib/utils';

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive',
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
