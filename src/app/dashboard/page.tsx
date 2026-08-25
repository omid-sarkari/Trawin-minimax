import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardService, type DeveloperOverview } from '@/services/dashboard.service';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata = { title: 'داشبورد' };

const NAV = [
  {
    href: '/dashboard',
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
  {
    href: '/dashboard/exams',
    label: 'آزمون‌ها',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
        <path d="M9 12l2 2 4-5" />
        <rect x="4" y="3" width="16" height="18" rx="2" />
      </svg>
    ),
  },
];

const dateFormatter = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-zinc-50" dir="ltr">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-signal-400">{hint}</p>}
    </div>
  );
}

export default async function DeveloperDashboardPage() {
  const supabase = await createClient();
  const service = new DashboardService(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const appUserId = await service.getMyAppUserId();
  if (!appUserId) redirect('/login');

  const role = await service.getUserRole(appUserId);
  if (role === 'company') redirect('/company');

  let overview: DeveloperOverview = {
    totalAssessments: 0,
    averageScore: 0,
    bestScore: 0,
    latestLevel: null,
    recent: [],
  };
  try {
    overview = await service.getDeveloperOverview(appUserId);
  } catch {
    // اولین ورود بدون داده — حالت خالی نشان داده می‌شود
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'دولوپر';

  return (
    <DashboardShell
      title="داشبورد"
      subtitle={`خوش آمدی، ${displayName}`}
      navItems={NAV}
      userLabel={user.email ?? ''}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="آزمون‌های تکمیل‌شده" value={String(overview.totalAssessments)} />
        <StatCard
          label="میانگین نمره"
          value={`${overview.averageScore}`}
          hint={overview.totalAssessments > 0 ? `آخرین سطح: ${overview.latestLevel ?? '—'}` : undefined}
        />
        <StatCard label="بهترین نمره" value={`${overview.bestScore}`} />
      </div>

      {/* شروع آزمون */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-signal-500/20 bg-gradient-to-b from-signal-500/[0.07] to-transparent p-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-zinc-50">اولین آزمونت را بده</h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-400">
              آزمون‌های منتشرشده را ببین، شروع کن و مهارتت را با نمره واقعی اثبات کن.
            </p>
          </div>
          <a
            href="/dashboard/exams"
            className="inline-flex h-11 items-center justify-center rounded-full bg-signal-500 px-7 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400"
          >
            مشاهده آزمون‌ها
          </a>
        </div>
      </section>

      {/* فعالیت اخیر */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-300">فعالیت اخیر</h2>
        {overview.recent.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto h-8 w-8 text-zinc-700">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="mt-3 text-sm text-zinc-500">
              هنوز ارزیابی‌ای ثبت نشده. بعد از اولین آزمون، نتایج و Trust Score این‌جا نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {overview.recent.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    ارزیابی جلسه <span className="font-mono text-xs text-zinc-500" dir="ltr">{item.id.slice(0, 8)}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.completedAt ? dateFormatter.format(new Date(item.completedAt)) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {item.level && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-400">
                      {item.level}
                    </span>
                  )}
                  <span className="font-mono text-lg font-bold text-signal-400" dir="ltr">
                    {item.score ?? '—'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
