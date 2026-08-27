/**
 * PUT /api/assessment/sessions/[sessionId]/answers
 * Idempotent autosave of one answer (UPSERT on session+question).
 * Rejected once the session is no longer `started`.
 */

import {
  authenticate,
  handleAssessment,
  readJsonBody,
} from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'
import { saveAnswer } from '@/services/assessment/answer.service'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleAssessment(async () => {
    const { sessionId } = await params
    if (!sessionId) throw new AssessmentError('VALIDATION_ERROR')

    const body = await readJsonBody(request)
    const questionId = Number(body.question_id)
    if (!Number.isInteger(questionId) || questionId <= 0) {
      throw new AssessmentError('INVALID_ANSWER', 'شناسه سؤال نامعتبر است.')
    }

    const { svc, appUserId } = await authenticate()
    await saveAnswer(svc, {
      sessionId,
      appUserId,
      questionId,
      answerData: body.answer_data ?? {},
      timeSpentSeconds:
        typeof body.time_spent_seconds === 'number' ? body.time_spent_seconds : null,
    })
    return Response.json({ ok: true })
  })
}
