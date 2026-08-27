/**
 * PATCH /api/admin/exams/[examId]
 * Updates exam status (draft|published|archived|closed) and/or selection
 * mode configuration. Additive surface — the create/list endpoints are
 * untouched.
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

const EXAM_STATUSES = ['draft', 'published', 'archived', 'closed'] as const
const SELECTION_MODES = ['fixed', 'adaptive'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ examId: string }> },
): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const { examId } = await params
    const id = Number(examId)
    if (!Number.isInteger(id) || id <= 0) throw new Error('شناسه آزمون نامعتبر است.')

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const svc = createServiceClient()

    // ---- Exam status ------------------------------------------------------
    if (typeof body.status === 'string') {
      const status = body.status as (typeof EXAM_STATUSES)[number]
      if (!EXAM_STATUSES.includes(status)) throw new Error('وضعیت آزمون نامعتبر است.')
      if (status === 'published') {
        const { count } = await svc
          .from('exam_questions')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', id)
        if ((count ?? 0) === 0) throw new Error('برای انتشار، آزمون باید حداقل یک سؤال داشته باشد.')
      }
      const { error } = await svc.from('exams').update({ status }).eq('id', id)
      if (error) throw new Error(error.message)
    }

    // ---- Selection config ---------------------------------------------------
    if (body.selection_mode !== undefined || body.target_question_count !== undefined) {
      const mode = String(body.selection_mode ?? 'fixed')
      if (!SELECTION_MODES.includes(mode as (typeof SELECTION_MODES)[number])) {
        throw new Error('حالت انتخاب نامعتبر است.')
      }
      const rawCount = Number(body.target_question_count)
      const target =
        Number.isInteger(rawCount) && rawCount > 0 ? rawCount : null

      const { data: existing } = await svc
        .from('exam_selection_configs')
        .select('id')
        .eq('exam_id', id)
        .maybeSingle()

      if (existing) {
        const { error } = await svc
          .from('exam_selection_configs')
          .update({
            mode,
            target_question_count: target,
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('exam_id', id)
        if (error) throw new Error(`selection config: ${error.message}`)
      } else {
        const { error } = await svc.from('exam_selection_configs').insert({
          exam_id: id,
          mode,
          target_question_count: target,
          config: {},
          active: true,
        })
        if (error) throw new Error(`selection config: ${error.message}`)
      }
    }

    return { ok: true }
  })
}
