'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const authService = new AuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (password !== confirm) {
      setError('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message.includes('session')
            ? 'لینک بازیابی منقضی شده است. لطفاً دوباره درخواست دهید.'
            : err.message
          : 'خطا در تغییر رمز عبور'
      );
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
        {success ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-signal-500/30 bg-signal-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-signal-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">رمز عبور به‌روزرسانی شد</h2>
            <p className="text-sm text-zinc-400">در حال انتقال به داشبورد…</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">
                تنظیم رمز عبور جدید
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-400">رمز عبور جدید خود را انتخاب کنید.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  رمز عبور جدید
                </label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  dir="ltr"
                  className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
                  placeholder="حداقل ۶ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  تکرار رمز عبور
                </label>
                <input
                  id="confirm-password"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  dir="ltr"
                  className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
                  placeholder="تکرار"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-center text-sm leading-6 text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center rounded-full bg-signal-500 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'در حال ذخیره…' : 'ثبت رمز عبور جدید'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
