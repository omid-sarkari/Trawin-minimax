'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService, SignupRole } from '@/services/auth.service';

const ROLE_OPTIONS: Array<{
  value: SignupRole;
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'developer',
    title: 'برنامه‌نویس',
    desc: 'آزمون بده، مهارتت را اثبات کن، رزومه زنده بساز.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    value: 'company',
    title: 'شرکت',
    desc: 'بر اساس مهارتِ اثبات‌شده استخدام کن، نه بر اساس ادعا.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const [role, setRole] = useState<SignupRole>('developer');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const authService = new AuthService();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.signUp(email, password, fullName, {
        role,
        companyName: role === 'company' ? companyName : undefined,
      });
      setRegistered(true);
      setTimeout(() => router.push('/login?registered=true'), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت‌نام');
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
        {registered ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-signal-500/30 bg-signal-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-signal-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">ثبت‌نام انجام شد</h2>
            <p className="text-sm leading-7 text-zinc-400">
              برای فعال‌سازی حساب، ایمیل خود را تأیید کنید. در حال انتقال به صفحه ورود…
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">
                ساخت حساب کاربری
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-400">
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <Link href="/login" className="font-medium text-signal-400 hover:text-signal-300">
                  وارد شوید
                </Link>
              </p>
            </div>

            <fieldset className="grid grid-cols-2 gap-3" aria-label="نوع حساب">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={`rounded-xl border p-4 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 ${
                    role === option.value
                      ? 'border-signal-500/60 bg-signal-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                      role === option.value
                        ? 'border-signal-500/40 bg-signal-500/15 text-signal-400'
                        : 'border-white/10 bg-white/5 text-zinc-500'
                    }`}
                  >
                    {option.icon}
                  </span>
                  <span className="mt-3 block text-sm font-medium text-zinc-100">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">{option.desc}</span>
                </button>
              ))}
            </fieldset>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  نام کامل
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
                  placeholder={role === 'company' ? 'نام مسئول شرکت' : 'نام و نام خانوادگی'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {role === 'company' && (
                <div className="animate-fade-up">
                  <label htmlFor="company-name" className="mb-1.5 block text-sm font-medium text-zinc-300">
                    نام شرکت
                  </label>
                  <input
                    id="company-name"
                    name="companyName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
                    placeholder="مثلاً دیجی‌کالا"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}

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
                {isSubmitting ? 'در حال ثبت‌نام…' : role === 'company' ? 'ثبت‌نام شرکت' : 'ثبت‌نام برنامه‌نویس'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-600">با ثبت‌نام، قوانین تراوین را می‌پذیرید.</p>
    </div>
  );
}
