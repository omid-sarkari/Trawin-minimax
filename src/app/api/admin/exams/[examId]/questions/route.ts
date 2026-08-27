/**
 * Exam questions management (admin).
 *   GET    → attached questions (ordered) + selection config summary
 *   POST   → attach a question {question_id, question_order?, weight?}
 *   DELETE → detach ?question_id=
 *
 * Additive surface; existing admin endpoints remain untouched.
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

async function loadExamQuestions(svc: ReturnType<typeof createServiceClient>, examId: number) {
  const { data, error } = await svc
    .from('exam_questions')
    .select('id, question_id, question_order, weight, questions(id, slug, type, status, difficulty, question_versions(title, version))')
    .eq('exam_id', examId)
    .order('question_order', { ascending: true })
  if (error) throw new Error(`exam_questions: ${error.message}`)
  return data ?? []
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ examId: string }> },
): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const id = Number((await params).examId)
    if (!Number.isInteger(id)) throw new Error('شناسه آزمون نامعتبر است.')
    const svc = createServiceClient()

    const rows = await loadExamQuestions(svc, id)
    const { data: config } = await svc
      .from('exam_selection_configs')
      .select('mode, target_question_count, active')
      .eq('exam_id', id)
      .maybeSingle()
    const { count: publishedCount } = await svc
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    return {
      questions: rows,
      config: config ?? null,
      availablePublished: publishedCount ?? 0,
    }
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ examId: string }> },
): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const examId = Number((await params).examId)
    if (!Number.isInteger(examId) || examId <= 0) throw new Error('شناسه آزمون نامعتبر است.')

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const questionId = Number(body.question_id)
    if (!Number.isInteger(questionId) || questionId <= 0) throw new Error('سؤال را انتخاب کنید.')
    const order = Number(body.question_order)
    const weightRaw = Number(body.weight)

    const svc = createServiceClient()

    // Question must exist and be published to be attachable.
    const { data: question } = await svc
      .from('questions')
      .select('id, status')
      .eq('id', questionId)
      .maybeSingle()
    if (!question) throw new Error('سؤال پیدا نشد.')
    if (question.status !== 'published') throw new Error('فقط سؤال منتشرشده قابل افزودن است.')

    // Default order = max+1 for stable appends.
    let effectiveOrder = Number.isInteger(order) && order > 0 ? order : null
    if (effectiveOrder === null) {
      const rows = await loadExamQuestions(svc, examId)
      effectiveOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.question_order)) + 1 : 1
    }

    const { error } = await svc.from('exam_questions').upsert(
      {
        exam_id: examId,
        question_id: questionId,
        question_order: effectiveOrder,
        ...(Number.isFinite(weightRaw) && weightRaw > 0 ? { weight: weightRaw } : {}),
      },
      { onConflict: 'exam_id,question_id' },
    )
    if (error) throw new Error(error.message)
    return { ok: true, question_order: effectiveOrder }
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ examId: string }> },
): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const examId = Number((await params).examId)
    const questionId = Number(new URL(request.url).searchParams.get('question_id'))
    if (!Number.isInteger(examId) || !Number.isInteger(questionId)) {
      throw new Error('پارامتر نامعتبر است.')
    }
    const svc = createServiceClient()
    const { error } = await svc
      .from('exam_questions')
      .delete()
      .eq('exam_id', examId)
      .eq('question_id', questionId)
    if (error) throw new Error(error.message)
    return { ok: true }
  })
}
