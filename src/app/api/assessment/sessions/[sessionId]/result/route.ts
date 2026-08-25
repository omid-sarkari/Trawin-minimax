/**
 * GET /api/assessment/sessions/[sessionId]/result
 * Final result view (score, level, confidence, per-question outcomes).
 */

import { authenticate, handleAssessment } from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'
import { loadResult } from '@/services/assessment/exam-session.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleAssessment(async () => {
    const { sessionId } = await params
    if (!sessionId) throw new AssessmentError('VALIDATION_ERROR')

    const { svc, appUserId } = await authenticate()
    const { data: row } = await svc
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle()
    if (!row) throw new AssessmentError('SESSION_NOT_FOUND')
    if (row.user_id !== appUserId) throw new AssessmentError('AUTHORIZATION_ERROR')

    const result = await loadResult(svc, row as Parameters<typeof loadResult>[1])
    return Response.json(result)
  })
}
