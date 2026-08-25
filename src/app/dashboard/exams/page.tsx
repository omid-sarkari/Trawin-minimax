import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata = { title: 'آزمون‌ها | داشبورد' }

const MODE_LABELS: Record<string, string> = {
  fixed: 'ثابت',
  adaptive: 'تطبیقی',
}

interface ExamCard {
  id: number
  title: string
  description: string | null
  durationMinutes: number | null
  mode: string
  questionCount: number
}

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
]

export default async function ExamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUserId } = await supabase.rpc('get_my_user_id')
  if (!appUserId) redirect('/login')

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', String(appUserId))
    .maybeSingle()
  if (roleRow?.role === 'company') redirect('/company')

  // Published exams via privileged path; payload is already public metadata.
  const { createServiceClient } = await import('@/lib/admin/service-client')
  const svc = createServiceClient()
  const { data: exams } = await svc
    .from('exams')
    .select('id, title, description, duration_minutes, status')
    .eq('status', 'published')
    .order('id', { ascending: false })
    .limit(50)

  const ids = (exams ?? []).map((e) => e.id)
  const { data: configs } = await svc
    .from('exam_selection_configs')
    .select('exam_id, mode')
    .in('exam_id', ids.length ? ids : [-1])
  const modeByExam = new Map((configs ?? []).map((c) => [c.exam_id, c.mode]))

  const cards: ExamCard[] = (exams ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    durationMinutes: e.duration_minutes,
    mode: modeByExam.get(e.id) ?? 'fixed',
    questionCount: 0,
  }))

  return (
    <DashboardShell
      title="آزمون‌ها"
      subtitle="آزمون‌های منتشرشده را شروع کن یا ادامه بده"
      navItems={NAV}
      userLabel={user.email ?? ''}
    >
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm font-medium text-zinc-400">هنوز آزمونی منتشر نشده است</p>
          <p className="mt-2 text-xs leading-6 text-zinc-600">
            به‌محض انتشار اولین آزمون، همین‌جا قابل مشاهده خواهد بود.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((exam) => (
            <Link
              key={exam.id}
              href={`/dashboard/exams/${exam.id}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-signal-500/40 hover:bg-signal-500/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold leading-7 text-zinc-100">{exam.title}</h3>
                <span className="shrink-0 rounded-full border border-signal-500/25 bg-signal-500/10 px-2 py-0.5 text-[10px] text-signal-300">
                  {MODE_LABELS[exam.mode] ?? exam.mode}
                </span>
              </div>
              {exam.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-6 text-zinc-500">{exam.description}</p>
              )}
              <div className="mt-5 flex items-center justify-between">
                <span className="font-mono text-[11px] text-zinc-600" dir="ltr">
                  {exam.durationMinutes ? `${exam.durationMinutes} min` : '∞'}
                </span>
                <span className="text-xs text-signal-400 opacity-0 transition-opacity group-hover:opacity-100">
                  شروع ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
