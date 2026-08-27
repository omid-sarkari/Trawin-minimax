/**
 * POST /api/assessment/sessions/[sessionId]/submit
 * Finalizes the session (manual submit). Safe against double submits and
 * races with automatic expiry — both converge on one finalization path.
 */

import { authenticate, handleAssessment } from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'
import { submitExam } from '@/services/assessment/exam-session.service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleAssessment(async () => {
    const { sessionId } = await params
    if (!sessionId) throw new AssessmentError('VALIDATION_ERROR')

    const { svc, appUserId } = await authenticate()
    const result = await submitExam(svc, appUserId, sessionId)
    return Response.json(result)
  })
}
