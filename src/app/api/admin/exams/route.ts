import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

const EXAM_STATUSES = ['draft', 'published', 'archived', 'closed']

export async function GET() {
  return withAdmin(async () => {
    await assertAdmin()
    const svc = createServiceClient()
    const { data, error } = await svc
      .from('exams')
      .select('*, tracks(id, name)')
      .order('id', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)

    const { data: tracks } = await svc.from('tracks').select('id, name').order('id')
    return { exams: data ?? [], tracks: tracks ?? [] }
  })
}

export async function POST(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const title = String(body.title ?? '').trim()
    if (title.length < 3) throw new Error('عنوان آزمون الزامی است.')
    let slug = String(body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    if (slug.length < 3) slug = `exam-${Date.now().toString(36)}`

    const duration = Number(body.duration_minutes)
    const svc = createServiceClient()

    const { data: dup } = await svc.from('exams').select('id').eq('slug', slug).maybeSingle()
    if (dup) throw new Error('این slug قبلاً استفاده شده است.')

    const { data, error } = await svc
      .from('exams')
      .insert({
        title,
        slug,
        description: body.description ?? null,
        duration_minutes: Number.isInteger(duration) && duration > 0 ? duration : null,
        track_id: body.track_id ? Number(body.track_id) : null,
        status: EXAM_STATUSES.includes(body.status) ? body.status : 'draft',
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { exam: data }
  })
}
