import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'پنل مدیریت' }

async function getStats() {
  try {
    const { createServiceClient } = await import('@/lib/admin/service-client')
    const svc = createServiceClient()
    const [questions, published, users, exams, techs, skills] = await Promise.all([
      svc.from('questions').select('id', { count: 'exact', head: true }),
      svc.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      svc.from('users').select('id', { count: 'exact', head: true }),
      svc.from('exams').select('id', { count: 'exact', head: true }),
      svc.from('technologies').select('id', { count: 'exact', head: true }).eq('active', true),
      svc.from('skills').select('id', { count: 'exact', head: true }).eq('active', true),
    ])
    return {
      questions: questions.count ?? 0,
      published: published.count ?? 0,
      users: users.count ?? 0,
      exams: exams.count ?? 0,
      techs: techs.count ?? 0,
      skills: skills.count ?? 0,
      error: null as string | null,
    }
  } catch (err) {
    return {
      questions: 0,
      published: 0,
      users: 0,
      exams: 0,
      techs: 0,
      skills: 0,
      error: err instanceof Error ? err.message : 'خطا',
    }
  }
}

const QUICK_LINKS = [
  { href: '/admin/questions/new', title: 'سؤال جدید بساز', desc: 'ویزارد چندمرحله‌ای با ویرایشگر مخصوص هر نوع سؤال' },
  { href: '/admin/bulk-import', title: 'ایمپورت گروهی', desc: '۱۰۰+ سؤال را یک‌جا با پیش‌نمایش و اعمال اتمی وارد کن' },
  { href: '/admin/content', title: 'مدیریت محتوا', desc: 'تکنولوژی، مهارت و تگ‌ها — همه از دیتابیس خوانده می‌شوند' },
]

export default async function AdminOverviewPage() {
  const stats = await getStats()
  const fa = new Intl.NumberFormat('fa-IR')

  return (
    <div className="space-y-8">
      {stats.error && (
        <div className="rounded-lg border border-flag-500/25 bg-flag-500/10 px-3 py-2 text-sm text-flag-300">
          خطا در دریافت آمار: {stats.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'سؤالات', value: stats.questions, hint: `${stats.published} منتشرشده` },
          { label: 'کاربران', value: stats.users },
          { label: 'آزمون‌ها', value: stats.exams },
          { label: 'تکنولوژی فعال', value: stats.techs, hint: `${stats.skills} مهارت فعال` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="mt-2 font-mono text-3xl font-bold text-zinc-50" dir="ltr">
              {fa.format(s.value)}
            </p>
            {s.hint && <p className="mt-1.5 text-xs text-signal-400">{s.hint}</p>}
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-zinc-300">دسترسی سریع</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-0.5 hover:border-signal-500/30 hover:bg-white/[0.05]"
            >
              <h3 className="font-semibold text-zinc-50 group-hover:text-signal-300">{link.title}</h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-xs leading-6 text-zinc-600">
        نکته معماری: همه selector های این پنل (تکنولوژی، مهارت، تگ) مستقیم از دیتابیس خوانده می‌شوند؛
        افزودن تکنولوژی یا مهارت جدید نیازی به تغییر کد ندارد.
      </p>
    </div>
  )
}
