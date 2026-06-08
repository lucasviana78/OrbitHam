import { AlertTriangle, Inbox } from 'lucide-react';
import { Spinner } from './spinner';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <Spinner className="h-7 w-7" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertTriangle className="h-7 w-7 text-destructive" />
      <span className="text-sm text-muted-foreground">
        {message || 'Algo deu errado. Tente novamente.'}
      </span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Inbox className="h-7 w-7 text-muted-foreground/60" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
