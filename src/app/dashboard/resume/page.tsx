import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { LivingResumeService } from '@/services/resume/living-resume.service'
import { ResumeView } from '@/components/profile/ResumeView'

export const metadata = { title: 'رزومه زنده | داشبورد' }

const NAV = [
  { href: '/dashboard', label: 'نمای کلی' },
  { href: '/dashboard/exams', label: 'آزمون‌ها' },
  { href: '/dashboard/resume', label: 'رزومه زنده' },
  { href: '/dashboard/profile', label: 'پروفایل' },
]

const ICONS: Record<string, React.ReactNode> = {
  '/dashboard': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  '/dashboard/exams': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M9 12l2 2 4-5" />
      <rect x="4" y="3" width="16" height="18" rx="2" />
    </svg>
  ),
  '/dashboard/resume': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  ),
  '/dashboard/profile': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
}

export default async function ResumePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUserId } = await supabase.rpc('get_my_user_id')
  if (!appUserId) redirect('/login')
  const appUserIdStr = String(appUserId)

  const { createServiceClient } = await import('@/lib/admin/service-client')
  const svc = createServiceClient()

  // Onboarding gate consistency (§7).
  const { data: profileRow } = await svc
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', appUserIdStr)
    .maybeSingle()
  if (!profileRow?.onboarding_completed) redirect('/dashboard/onboarding')

  const service = new LivingResumeService(svc)
  const resume = await service.build(appUserIdStr, 'developer', {
    includeHiddenSections: true,
  })

  return (
    <DashboardShell
      title="رزومه زنده"
      subtitle="از شواهد واقعی ارزیابی ساخته می‌شود — بدون کپی دستی"
      navItems={NAV.map((n) => ({ ...n, icon: ICONS[n.href] }))}
      userLabel={user.email ?? ''}
    >
      <ResumeView initial={resume} />
    </DashboardShell>
  )
}
