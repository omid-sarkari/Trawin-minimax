'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthService, resolveDashboardPath } from '@/services/auth.service';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const authService = new AuthService();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.signIn(email, password);
      let role: string | null = null;
      try {
        role = await authService.resolveRole(email);
      } catch {
        role = null;
      }
      router.push(resolveDashboardPath(role, email));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Email not confirmed') {
        setError('ثبت‌نام شما موفق بود، اما برای ورود ابتدا باید ایمیل خود را تأیید کنید. لطفاً صندوق ورودی خود را بررسی کنید.');
      } else {
        setError(err instanceof Error ? err.message : 'خطا در ورود به سیستم');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(22,181,135,0.14),transparent)]" />

      <Link href="/" className="mb-8 font-mono text-sm font-semibold tracking-tight text-zinc-100">
        Trawin<span className="text-signal-500">.</span>
      </Link>

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">
            ورود به تراوین
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="font-medium text-signal-400 hover:text-signal-300">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>

        {registered && (
          <div className="rounded-lg border border-signal-500/25 bg-signal-500/10 px-4 py-3 text-center text-sm text-signal-300">
            ثبت‌نام با موفقیت انجام شد! پس از تأیید ایمیل می‌توانید وارد شوید.
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email-address" className="mb-1.5 block text-sm font-medium text-zinc-300">
              ایمیل
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
              رمز عبور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-center text-sm leading-6 text-rose-300">
              {error}
            </div>
          )}

          <div className="text-center">
            <Link
              href="/reset-password"
              className="text-xs font-medium text-zinc-400 transition-colors hover:text-signal-300"
            >
              رمز عبور را فراموش کرده‌اید؟
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center rounded-full bg-signal-500 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'در حال ورود…' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
