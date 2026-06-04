'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/types';
import { useRegister } from '@/hooks/use-auth';
import { ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FieldError, FormError } from '@/components/ui/field';
import { Brand } from '@/components/brand';

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    setFormError(null);
    try {
      await registerUser.mutateAsync(values);
      router.push('/login');
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Não foi possível registrar.',
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader className="items-center gap-3 text-center">
          <Brand />
          <div>
            <h1 className="text-xl font-semibold">Criar conta</h1>
            <p className="text-sm text-muted-foreground">
              Junte-se à estação terrestre
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError message={formError} />
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="indicativo ou apelido"
                {...register('username')}
              />
              <FieldError message={errors.username?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="mínimo 8 caracteres"
                {...register('password')}
              />
              <FieldError message={errors.password?.message} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando…' : 'Criar conta'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
