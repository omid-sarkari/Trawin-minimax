import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

const STATUSES = ['active', 'inactive', 'suspended', 'pending']
const ROLES = ['developer', 'company', 'admin']
const PAGE_SIZE = 20

export async function GET(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const url = new URL(request.url)
    const svc = createServiceClient()

    const q = url.searchParams.get('q')?.trim()
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)

    let query = svc
      .from('users')
      .select(
        'id, auth_user_id, username, phone, role, status, created_at, profiles(full_name, email)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (q) query = query.ilike('username', `%${q}%`)
    if (ROLES.includes(role ?? '')) query = query.eq('role', role)
    if (STATUSES.includes(status ?? '')) query = query.eq('status', status)

    const { data, error, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (error) throw new Error(error.message)

    return {
      items: data ?? [],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      statuses: STATUSES,
      roles: ROLES,
    }
  })
}

export async function PATCH(request: Request) {
  return withAdmin(async () => {
    const { authUserId } = await assertAdmin()
    const body = await request.json()
    const id = String(body.id ?? '').trim()
    if (!id) throw new Error('شناسه نامعتبر است.')
    const svc = createServiceClient()

    const { data: target } = await svc.from('users').select('*').eq('id', id).maybeSingle()
    if (!target) throw new Error('کاربر یافت نشد.')

    if (target.auth_user_id === authUserId && (body.status !== undefined || body.role !== undefined)) {
      throw new Error('نمی‌توانید وضعیت یا نقش حساب خودتان را تغییر دهید.')
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) throw new Error('وضعیت نامعتبر است.')
      patch.status = body.status
    }
    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) throw new Error('نقش نامعتبر است.')
      patch.role = body.role
    }

    const { data, error } = await svc.from('users').update(patch).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { user: data }
  })
}
