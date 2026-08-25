/**
 * POST /api/assessment/sessions/[sessionId]/questions/[questionId]/code
 * Coding/debugging execution pipeline. Judge0 credentials stay server-side;
 * provider outages never mark the user wrong.
 */

import {
  authenticate,
  handleAssessment,
  readJsonBody,
} from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'
import { submitCode } from '@/services/assessment/code-execution.service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; questionId: string }> },
): Promise<Response> {
  return handleAssessment(async () => {
    const { sessionId, questionId } = await params
    const qid = Number(questionId)
    if (!sessionId || !Number.isInteger(qid) || qid <= 0) {
      throw new AssessmentError('VALIDATION_ERROR')
    }

    const body = await readJsonBody(request)
    const { svc, appUserId } = await authenticate()
    const result = await submitCode(
      svc,
      { appUserId },
      sessionId,
      qid,
      { source_code: body.source_code, language: body.language },
    )
    return Response.json(result.public)
  })
}
