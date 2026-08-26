/**
 * Custom resume sections CRUD — developer's OWN entries only
 * (p3.md Persian addendum: DB-persisted, toggleable, shown in resume).
 *
 * POST   → create section
 * PATCH  → update (title/content/is_visible/order) ?id=
 * DELETE → remove ?id=
 */

import {
  authenticate,
  handleAssessment,
  readJsonBody,
} from '@/lib/assessment/route-helpers'
import { asJson } from '@/lib/assessment/types'
import type { Database } from '@/types/database'

type SectionRow = Database['public']['Tables']['developer_resume_sections']

const KINDS = new Set([
  'project',
  'experience',
  'education',
  'achievement',
  'competition',
  'certification',
  'link',
  'custom',
])

export async function POST(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const body = await readJsonBody(request)
    const kind = String(body.kind ?? '')
    if (!KINDS.has(kind)) return Response.json({ error: 'نوع بخش نامعتبر است.' }, { status: 400 })

    const title = String(body.title ?? '').trim()
    if (title.length < 2 || title.length > 120) {
      return Response.json({ error: 'عنوان بخش الزامی است (۲ تا ۱۲۰ کاراکتر).' }, { status: 400 })
    }

    const insert: SectionRow['Insert'] = {
      user_id: appUserId,
      kind,
      title,
      subtitle: typeof body.subtitle === 'string' ? body.subtitle.slice(0, 160) : null,
      content: asJson(body.content ?? {}),
      is_visible: body.is_visible !== false,
      display_order:
        Number.isInteger(Number(body.display_order)) && Number(body.display_order) >= 0
          ? Number(body.display_order)
          : 0,
      managed_by: 'developer',
    }
    const { data, error } = await svc.from('developer_resume_sections').insert(insert).select('id').single()
    if (error) return Response.json({ error: 'ذخیره بخش ناموفق بود.' }, { status: 500 })
    return Response.json({ ok: true, id: data!.id })
  })
}

export async function PATCH(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'شناسه نامعتبر است.' }, { status: 400 })
    }

    // Ownership gate — a developer may only touch their own rows.
    const { data: owned } = await svc
      .from('developer_resume_sections')
      .select('id')
      .eq('id', id)
      .eq('user_id', appUserId)
      .maybeSingle()
    if (!owned) return Response.json({ error: 'این بخش به شما تعلق ندارد.' }, { status: 403 })

    const body = await readJsonBody(request)
    const patch: Partial<SectionRow['Update']> = {}
    if (typeof body.title === 'string' && body.title.trim().length >= 2) patch.title = body.title.trim().slice(0, 120)
    if ('subtitle' in body) patch.subtitle = typeof body.subtitle === 'string' ? body.subtitle.slice(0, 160) : null
    if ('content' in body) patch.content = asJson(body.content ?? {})
    if ('is_visible' in body) patch.is_visible = body.is_visible === true
    if ('display_order' in body && Number.isInteger(Number(body.display_order))) {
      patch.display_order = Math.max(0, Number(body.display_order))
    }

    const { error } = await svc.from('developer_resume_sections').update(patch).eq('id', id)
    if (error) return Response.json({ error: 'به‌روزرسانی ناموفق بود.' }, { status: 500 })
    return Response.json({ ok: true })
  })
}

export async function DELETE(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'شناسه نامعتبر است.' }, { status: 400 })
    }
    const { error } = await svc
      .from('developer_resume_sections')
      .delete()
      .eq('id', id)
      .eq('user_id', appUserId)
    if (error) return Response.json({ error: 'حذف ناموفق بود.' }, { status: 500 })
    return Response.json({ ok: true })
  })
}
