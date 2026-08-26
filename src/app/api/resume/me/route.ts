/**
 * GET /api/resume/me — the developer's own Living Resume (developer view).
 * Derived from canonical evidence; visibility rules applied server-side.
 */

import { authenticate, handleAssessment } from '@/lib/assessment/route-helpers'
import { LivingResumeService } from '@/services/resume/living-resume.service'

export async function GET(): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const service = new LivingResumeService(svc)
    const resume = await service.build(appUserId, 'developer', {
      includeHiddenSections: true, // owner sees their hidden sections too
    })
    return Response.json(resume)
  })
}
