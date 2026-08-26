/**
 * GET /api/admin/resumes — server-side developer/resume search (§14).
 * Filters: q (username/full-name), technology, skill, role, status, plan,
 * assessment state. Paginated — never loads all developers.
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

export async function GET(request: Request): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim()
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const technologyId = Number(url.searchParams.get('technology_id'))
    const hasAssessments = url.searchParams.get('has_assessments')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = 20

    const svc = createServiceClient()

    // Candidate user ids narrowed by joins when needed.
    let userIds: string[] | null = null
    if (Number.isInteger(technologyId) && technologyId > 0) {
      const { data } = await svc
        .from('skill_scores')
        .select('evaluations!inner(user_id)')
        .eq('skills.technology_id', technologyId)
      userIds = [...new Set((data ?? []).map((r: Record<string, unknown>) => String((r.evaluations as { user_id: string }).user_id)))]
      if (userIds.length === 0) return { items: [], total: 0, page, pageSize }
    }

    let query = svc
      .from('users')
      .select(
        `id, username, role, status, created_at,
         profiles!left(full_name, headline, avatar_url, country, target_role, onboarding_completed, primary_technology_id),
         evaluations(count)`,
        { count: 'exact', head: false }
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (q) query = query.or(`username.ilike.%${q}%,profiles.full_name.ilike.%${q}%`)
    if (role && ['developer', 'company', 'admin'].includes(role)) query = query.eq('role', role)
    if (status && ['active', 'blocked'].includes(status)) query = query.eq('status', status)
    if (userIds) query = query.in('id', userIds)
    if (hasAssessments === '1') query = query.gt('evaluations.count', 0)
    if (hasAssessments === '0') query = query.eq('evaluations.count', 0)

    const { data, count, error } = await query
    if (error) throw new Error(`resumes search: ${error.message}`)

    const rows = (data ?? []) as Array<Record<string, unknown>>
    return {
      items: rows.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
        profile: Array.isArray(u.profiles) ? u.profiles[0] : u.profiles,
        assessmentsCount: Array.isArray(u.evaluations) ? (u.evaluations[0]?.count ?? 0) : 0,
      })),
      total: count ?? 0,
      page,
      pageSize,
    }
  })
}
