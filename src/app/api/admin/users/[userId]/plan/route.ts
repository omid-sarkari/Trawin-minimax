/**
 * PATCH /api/admin/users/[userId]/plan — grant/revoke Pro (§12).
 * Centralized through EntitlementService; billing will write user_plans
 * here later. No scattered plan checks anywhere else.
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'
import { EntitlementService } from '@/lib/profile/entitlements'

type Ctx = { params: Promise<{ userId: string }> }

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  return withAdmin(async () => {
    const { authUserId } = await assertAdmin()
    const { userId } = await params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const planCode = String(body.plan ?? '')
    if (!['free', 'pro'].includes(planCode)) throw new Error('پلن نامعتبر است.')

    const svc = createServiceClient()
    const entitlements = new EntitlementService(svc)
    await entitlements.setPlan(userId, planCode as 'free' | 'pro', null)
    void authUserId
    return { ok: true, plan: planCode }
  })
}
