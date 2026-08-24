import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

export async function POST(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const slug = String(body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    const technologyId = Number(body.technology_id)
    if (name.length < 2) throw new Error('نام مهارت الزامی است.')
    if (slug.length < 2) throw new Error('slug معتبر وارد کنید.')
    if (!Number.isInteger(technologyId) || technologyId <= 0) throw new Error('تکنولوژی والد الزامی است.')

    const svc = createServiceClient()
    const { data: tech } = await svc.from('technologies').select('id').eq('id', technologyId).maybeSingle()
    if (!tech) throw new Error('تکنولوژی یافت نشد.')

    const { data: dup } = await svc
      .from('skills')
      .select('id')
      .eq('technology_id', technologyId)
      .eq('slug', slug)
      .maybeSingle()
    if (dup) throw new Error('این slug در این تکنولوژی قبلاً ثبت شده است.')

    const parentId = body.parent_id ? Number(body.parent_id) : null
    const { data, error } = await svc
      .from('skills')
      .insert({
        technology_id: technologyId,
        parent_id: parentId && Number.isInteger(parentId) ? parentId : null,
        name,
        slug,
        active: body.active ?? true,
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { skill: data }
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
    if (Object.keys(patch).length === 0) throw new Error('چیزی برای به‌روزرسانی نیست.')

    const svc = createServiceClient()
    const { data, error } = await svc.from('skills').update(patch).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { skill: data }
  })
}
