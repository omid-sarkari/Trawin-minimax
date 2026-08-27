/**
 * PUT /api/profile — update own professional profile (p3.md §16-§17).
 * Ownership comes from the session; the body can never target another user.
 */

import {
  authenticate,
  handleAssessment,
  readJsonBody,
} from '@/lib/assessment/route-helpers'
import { ProfileService } from '@/services/profile.service'

export async function PUT(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const body = await readJsonBody(request)
    const service = new ProfileService(svc)
    await service.updateProfile(appUserId, body)
    const state = await service.getOnboardingState(appUserId)
    return Response.json({ ok: true, profile: state.profile })
  })
}
