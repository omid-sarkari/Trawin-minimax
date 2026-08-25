/**
 * Assessment route helpers — authentication + uniform error translation.
 *
 * Security model (established project pattern): browser → API route
 * (session check via anon-key server client) → service-role client → DB.
 * RLS stays intact; privileged reads/writes happen only here.
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/admin/service-client'
import { AssessmentError, toAssessmentError } from '@/lib/assessment/errors'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface AuthedContext {
  /** Anon-key client bound to the caller's cookies (identity only). */
  auth: SupabaseClient<Database>
  /** Privileged server client — never expose its results raw. */
  svc: ReturnType<typeof createServiceClient>
  authUserId: string
  /** Canonical public.users.id used by application tables. */
  appUserId: string
}

export async function authenticate(): Promise<AuthedContext> {
  const auth = await createClient()
  const {
    data: { user },
    error,
  } = await auth.auth.getUser()
  if (error || !user) throw new AssessmentError('AUTHENTICATION_ERROR')

  const { data: appUserId, error: rpcError } = await auth.rpc('get_my_user_id')
  if (rpcError || !appUserId) throw new AssessmentError('AUTHENTICATION_ERROR')

  return { auth, svc: createServiceClient(), authUserId: user.id, appUserId }
}

export async function handleAssessment(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (err) {
    return toAssessmentError(err).toResponse()
  }
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new AssessmentError('VALIDATION_ERROR')
    }
    return body as Record<string, unknown>
  } catch (err) {
    if (err instanceof AssessmentError) throw err
    throw new AssessmentError('VALIDATION_ERROR', undefined)
  }
}
