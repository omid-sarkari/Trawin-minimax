import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

const CATEGORIES = ['language', 'markup', 'styling', 'framework', 'runtime', 'tooling']

export async function POST(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const slug = String(body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    if (name.length < 2) throw new Error('نام تکنولوژی الزامی است.')
    if (slug.length < 2) throw new Error('slug معتبر وارد کنید.')
    if (!CATEGORIES.includes(body.category)) throw new Error('دسته نامعتبر است.')

    const svc = createServiceClient()
    const { data: dup } = await svc.from('technologies').select('id').eq('slug', slug).maybeSingle()
    if (dup) throw new Error('این slug قبلاً استفاده شده است.')

    const { data, error } = await svc
      .from('technologies')
      .insert({ name, slug, category: body.category, active: body.active ?? true })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { technology: data }
  })
}

export async function PATCH(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) throw new Error('شناسه نامعتبر است.')

    const patch: Record<string, unknown> = {}
    if (typeof body.active === 'boolean') patch.active = body.active
    if (typeof body.name === 'string' && body.name.trim().length >= 2) patch.name = body.name.trim()
    if (body.category && CATEGORIES.includes(body.category)) patch.category = body.category
    if (Object.keys(patch).length === 0) throw new Error('چیزی برای به‌روزرسانی نیست.')

    const svc = createServiceClient()
    const { data, error } = await svc.from('technologies').update(patch).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { technology: data }
  })
}
