/**
 * POST /api/assessment/exams/[examId]/start
 * Idempotent: creates a session or recovers the existing active one.
 */

import { authenticate, handleAssessment } from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'
import { startExam } from '@/services/assessment/exam-session.service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ examId: string }> },
): Promise<Response> {
  return handleAssessment(async () => {
    const { examId } = await params
    if (!examId) throw new AssessmentError('VALIDATION_ERROR')

    const { svc, appUserId, authUserId } = await authenticate()
    const state = await startExam(svc, { appUserId, authUserId }, examId)
    return Response.json(state)
  })
}
