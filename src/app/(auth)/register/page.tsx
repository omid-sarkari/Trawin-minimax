'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const authService = new AuthService();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.signUp(email, password, fullName);
      alert('ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تایید کنید.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            ساخت حساب کاربری در تراوین
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="full-name" className="sr-only">نام کامل</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="نام و نام خانوادگی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">ایمیل</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="آدرس ایمیل"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">رمز عبور</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="رمز عبور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              ثبت‌نام
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
