import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ExamRunner } from '@/components/assessment/ExamRunner'

export const metadata = { title: 'جلسه آزمون' }

export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'دولوپر'

  return (
    <DashboardShell
      title="جلسه آزمون"
      subtitle={displayName}
      navItems={[]}
      userLabel={user.email ?? ''}
    >
      <ExamRunner examId={examId} />
    </DashboardShell>
  )
}
