'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthService } from '@/services/auth.service';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authService = new AuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.resetPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال ایمیل بازیابی');
    } finally {
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
        {sent ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-signal-500/30 bg-signal-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-signal-400">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">ایمیل بازیابی ارسال شد</h2>
            <p className="text-sm leading-7 text-zinc-400">
              اگر این ایمیل در تراوین ثبت شده باشد، لینک تنظیم رمز عبور جدید برایتان ارسال شد.
              صندوق ورودی (و پوشه spam) را بررسی کنید.
            </p>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-zinc-200 transition-colors hover:border-white/35 hover:bg-white/5"
            >
              بازگشت به ورود
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">
                بازیابی رمز عبور
              </h2>
              <p className="mt-2 text-center text-sm leading-6 text-zinc-400">
                ایمیل حساب خود را وارد کنید تا لینک تنظیم رمز عبور جدید برایتان ارسال شود.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              {error && (
                <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center rounded-full bg-signal-500 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'در حال ارسال…' : 'ارسال لینک بازیابی'}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-400">
              به یاد آوردید؟{' '}
              <Link href="/login" className="font-medium text-signal-400 hover:text-signal-300">
                بازگشت به ورود
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
