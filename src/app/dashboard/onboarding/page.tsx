import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { OnboardingWizard } from '@/components/profile/OnboardingWizard'

export const metadata = { title: 'شروع آشنایی | تراوین' }

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

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUserId } = await supabase.rpc('get_my_user_id')
  if (!appUserId) redirect('/login')

  // Technologies are dynamic — never hardcoded (§4).
  const { createServiceClient } = await import('@/lib/admin/service-client')
  const svc = createServiceClient()
  const [{ data: technologies }, { data: profile }] = await Promise.all([
    svc.from('technologies').select('id, name, slug, category').eq('active', true).order('name'),
    svc
      .from('profiles')
      .select('onboarding_completed, onboarding_data, target_role, work_preference, primary_technology_id, experience_years')
      .eq('user_id', String(appUserId))
      .maybeSingle(),
  ])

  if (profile?.onboarding_completed) redirect('/dashboard')

  const initial = {
    intents: ((profile?.onboarding_data as Record<string, unknown>)?.intents as string[]) ?? [],
    primaryTechnologyId: profile?.primary_technology_id ?? null,
    targetRole: profile?.target_role ?? '',
    experienceLevel:
      ((profile?.onboarding_data as Record<string, unknown>)?.experience_level as string) ?? '',
    workPreference: (profile?.work_preference as string[]) ?? [],
  }

  return (
    <DashboardShell
      title="شروع آشنایی"
      subtitle="چند سؤال کوتاه تا تراوین مسیرت را شخصی‌سازی کند"
      navItems={NAV}
      userLabel={user.email ?? ''}
    >
      <OnboardingWizard
        technologies={(technologies ?? []).map((t) => ({ id: t.id, name: t.name, category: t.category ?? '' }))}
        initial={initial}
      />
    </DashboardShell>
  )
}
