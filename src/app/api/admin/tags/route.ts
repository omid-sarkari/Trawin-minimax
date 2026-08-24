import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

export async function POST(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const slug = String(
      body.slug ?? name.toLowerCase().replace(/\s+/g, '-')
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    if (name.length < 2) throw new Error('نام تگ الزامی است.')
    if (slug.length < 2) throw new Error('slug معتبر وارد کنید.')

    const svc = createServiceClient()
    const { data: dup } = await svc.from('question_tags').select('id').eq('slug', slug).maybeSingle()
    if (dup) throw new Error('این تگ قبلاً ثبت شده است.')

    const { data, error } = await svc.from('question_tags').insert({ name, slug }).select('*').single()
    if (error) throw new Error(error.message)
    return { tag: data }
  })
}
