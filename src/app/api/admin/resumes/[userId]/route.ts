/**
 * GET /api/admin/resumes/[userId] — full admin view of one developer's
 * resume: every section (including hidden), plan, and account status.
 * Admin visibility ≠ company visibility (§14/§26).
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'
import { LivingResumeService } from '@/services/resume/living-resume.service'
import { EntitlementService } from '@/lib/profile/entitlements'

type Ctx = { params: Promise<{ userId: string }> }

export async function GET(_request: Request, { params }: Ctx): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const { userId } = await params
    const svc = createServiceClient()

    const { data: user } = await svc
      .from('users')
      .select('id, username, role, status')
      .eq('id', userId)
      .maybeSingle()
    if (!user) throw new Error('کاربر پیدا نشد.')

    const service = new LivingResumeService(svc)
    const resume = await service.build(userId, 'developer', { includeHiddenSections: true })

    const entitlements = new EntitlementService(svc)
    const planInfo = await entitlements.getPlan(userId)

    // Plain object — withAdmin wraps it in Response.json itself.
    return {
      user: { id: user.id, username: user.username, role: user.role, status: user.status },
      plan: planInfo.plan,
      resume,
    }
  })
}
