/**
 * GET /api/assessment/exams — published exams available to the signed-in
 * user. Read-only, sanitized (no hidden metadata).
 */

import { authenticate, handleAssessment } from '@/lib/assessment/route-helpers'
import { AssessmentError } from '@/lib/assessment/errors'

export async function GET(): Promise<Response> {
  return handleAssessment(async () => {
    const { svc } = await authenticate()

    const { data: exams, error } = await svc
      .from('exams')
      .select('id, title, slug, description, duration_minutes, track_id, status')
      .eq('status', 'published')
      .order('id', { ascending: false })
      .limit(50)
    if (error) throw new AssessmentError('INTERNAL_ERROR', `exams: ${error.message}`)

    const ids = (exams ?? []).map((e) => e.id)
    const { data: configs } = await svc
      .from('exam_selection_configs')
      .select('exam_id, mode')
      .in('exam_id', ids.length ? ids : [-1])
    const modeByExam = new Map((configs ?? []).map((c) => [c.exam_id, c.mode]))

    const { data: counts } = await svc
      .from('exam_questions')
      .select('exam_id')
      .in('exam_id', ids.length ? ids : [-1])
    const countByExam = new Map<number, number>()
    for (const row of counts ?? []) {
      countByExam.set(row.exam_id, (countByExam.get(row.exam_id) ?? 0) + 1)
    }

    return Response.json({
      exams: (exams ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: e.description,
        durationMinutes: e.duration_minutes,
        mode: modeByExam.get(e.id) ?? 'fixed',
        questionCount: countByExam.get(e.id) ?? 0,
      })),
    })
  })
}
