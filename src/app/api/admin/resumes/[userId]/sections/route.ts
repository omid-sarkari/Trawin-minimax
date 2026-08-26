/**
 * Admin CRUD for a developer's custom resume sections
 * (p3.md Persian addendum: admin adds content → persists in DB → shows in
 * resume, toggleable).
 *
 * POST   {kind,title,subtitle?,content?,is_visible?}
 * PATCH  ?id= {...}
 * DELETE ?id=
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'
import { asJson } from '@/lib/assessment/types'

type Ctx = { params: Promise<{ userId: string }> }

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

export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const { userId } = await params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    const kind = String(body.kind ?? '')
    if (!KINDS.has(kind)) throw new Error('نوع بخش نامعتبر است.')
    const title = String(body.title ?? '').trim()
    if (title.length < 2 || title.length > 120) throw new Error('عنوان بخش الزامی است.')

    // Target user must exist.
    const svc = createServiceClient()
    const { data: user } = await svc.from('users').select('id').eq('id', userId).maybeSingle()
    if (!user) throw new Error('کاربر پیدا نشد.')

    const { data, error } = await svc
      .from('developer_resume_sections')
      .insert({
        user_id: userId,
        kind,
        title,
        subtitle: typeof body.subtitle === 'string' ? body.subtitle.slice(0, 160) : null,
        content: asJson(body.content ?? {}),
        is_visible: body.is_visible !== false,
        display_order:
          Number.isInteger(Number(body.display_order)) && Number(body.display_order) >= 0
            ? Number(body.display_order)
            : 0,
        managed_by: 'admin',
      })
      .select('id')
      .single()
    if (error) throw new Error(`section create: ${error.message}`)
    return { ok: true, id: data!.id }
  })
}

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    void (await params)
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!Number.isInteger(id)) throw new Error('شناسه نامعتبر است.')

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const patch: Record<string, unknown> = {}
    if (typeof body.title === 'string' && body.title.trim().length >= 2) patch.title = body.title.trim().slice(0, 120)
    if ('subtitle' in body) patch.subtitle = typeof body.subtitle === 'string' ? body.subtitle.slice(0, 160) : null
    if ('content' in body) patch.content = asJson(body.content ?? {})
    if ('is_visible' in body) patch.is_visible = body.is_visible === true
    if ('display_order' in body && Number.isInteger(Number(body.display_order))) {
      patch.display_order = Math.max(0, Number(body.display_order))
    }
    if ('managed_by' in body && body.managed_by === 'admin') patch.managed_by = 'admin'

    const svc = createServiceClient()
    const { error } = await svc.from('developer_resume_sections').update(patch).eq('id', id)
    if (error) throw new Error(`section update: ${error.message}`)
    return { ok: true }
  })
}

export async function DELETE(request: Request, { params }: Ctx): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    void (await params)
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!Number.isInteger(id)) throw new Error('شناسه نامعتبر است.')
    const svc = createServiceClient()
    const { error } = await svc.from('developer_resume_sections').delete().eq('id', id)
    if (error) throw new Error(`section delete: ${error.message}`)
    return { ok: true }
  })
}
