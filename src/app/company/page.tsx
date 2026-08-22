import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata = { title: 'داشبورد شرکت' };

const NAV = [
  {
    href: '/company',
    label: 'نمای کلی',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
];

const PLACEHOLDER_CARDS = [
  {
    title: 'آگهی‌های شغلی',
    desc: 'موقعیت‌های شغلی خود را تعریف کنید و بر اساس مهارت اثبات‌شده نامزدها را فیلتر کنید.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: 'نامزدها',
    desc: 'توسعه‌دهندگانی که مهارتشان در تراوین اثبات شده، همراه با Trust Score و گزارش رفتارشناسی.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'چالش اختصاصی',
    desc: 'آزمون تطبیقی اختصاصی برند شما؛ دعوت از نامزدها و دریافت گزارش کامل.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const service = new DashboardService(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const appUserId = await service.getMyAppUserId();
  if (!appUserId) redirect('/login');

  const role = await service.getUserRole(appUserId);
  if (role && role !== 'company') redirect('/dashboard');

  const companyName =
    (user.user_metadata?.company_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    'شرکت شما';

  return (
    <DashboardShell
      title="داشبورد شرکت"
      subtitle={companyName}
      navItems={NAV}
      userLabel={user.email ?? ''}
    >
      {/* Welcome */}
      <section className="overflow-hidden rounded-2xl border border-signal-500/20 bg-gradient-to-b from-signal-500/[0.07] to-transparent p-8">
        <span className="font-mono text-xs tracking-widest text-signal-500">FOR COMPANIES</span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-50">استخدام بدون حدس.</h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
          به‌زودی می‌توانید موقعیت شغلی تعریف کنید، نامزدانی با مهارتِ اثبات‌شده ببینید و
          مستقیم به چالش یا مصاحبه دعوتشان کنید.
        </p>
      </section>

      {/* Placeholder modules */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLACEHOLDER_CARDS.map((card) => (
          <article
            key={card.title}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-signal-500/25"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-signal-500/20 bg-signal-500/10 text-signal-400">
                {card.icon}
              </span>
              <span className="rounded-full border border-flag-500/30 bg-flag-500/10 px-2.5 py-0.5 text-[11px] font-medium text-flag-300">
                به‌زودی
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-50">{card.title}</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{card.desc}</p>
            <p className="mt-4 font-mono text-2xl font-bold text-zinc-800" dir="ltr">
              00
            </p>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
