/**
 * GET /api/assessment/sessions/[sessionId]
 * Reconstructs the full session state after refresh / reconnect, or the
 * result once the session has finished. Server-authoritative timer.
 */

import { authenticate, handleAssessment } from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'
import { getSessionState } from '@/services/assessment/exam-session.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleAssessment(async () => {
    const { sessionId } = await params
    if (!sessionId) throw new AssessmentError('VALIDATION_ERROR')

    const { svc, appUserId, authUserId } = await authenticate()
    const payload = await getSessionState(svc, { appUserId, authUserId }, sessionId)
    return Response.json(payload)
  })
}
