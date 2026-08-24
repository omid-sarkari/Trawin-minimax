import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from './service-client'

export class AdminError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function adminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Server-side admin guard. Verifies the caller's session and that the account
 * is either in the bootstrap allowlist or has role='admin' in public.users.
 * Never trusts the client.
 */
export async function assertAdmin(): Promise<{ authUserId: string; email: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new AdminError(401, 'برای این عملیات باید وارد شوید.')

  const email = (user.email ?? '').toLowerCase()
  if (adminEmails().includes(email)) return { authUserId: user.id, email }

  const svc = createServiceClient()
  const { data } = await svc.from('users').select('role').eq('auth_user_id', user.id).maybeSingle()
  if (data?.role === 'admin') return { authUserId: user.id, email }

  throw new AdminError(403, 'دسترسی ادمین لازم است.')
}

export async function withAdmin<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const result = await fn()
    return Response.json(result ?? { ok: true })
  } catch (error) {
    if (error instanceof AdminError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'خطای ناشناخته سرور'
    return Response.json({ error: message }, { status: 500 })
  }
}
