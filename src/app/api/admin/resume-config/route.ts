/**
 * GET   → visibility rules grouped by view + ACTIVE verification policy
 * PATCH → {view_type, section_key, enabled} toggle a rule
 *         | {policy: {verified:{...}, emerging:{...}}} — appends a NEW
 *           rule_version so history stays intact (decision-engine §31).
 */

import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'
import { LivingResumeService } from '@/services/resume/living-resume.service'

const VIEWS = new Set(['developer', 'company', 'pro'])

export async function GET(): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const svc = createServiceClient()
    const { data, error } = await svc
      .from('resume_visibility_rules')
      .select('*')
      .order('view_type')
      .order('sort_order')
    if (error) throw new Error(`rules: ${error.message}`)

    const grouped: Record<string, Array<Record<string, unknown>>> = {}
    for (const row of data ?? []) {
      grouped[row.view_type] = grouped[row.view_type] ?? []
      grouped[row.view_type].push(row)
    }

    const service = new LivingResumeService(svc)
    const policy = await service.loadVerificationPolicy()

    return { rules: grouped, policy }
  })
}

export async function PATCH(request: Request): Promise<Response> {
  return withAdmin(async () => {
    await assertAdmin()
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const svc = createServiceClient()

    // ---- Verification policy edit → versioned rule_versions append -------
    if ('policy' in body) {
      const policy = body.policy as { verified?: Record<string, number>; emerging?: Record<string, number> }
      if (!policy || typeof policy !== 'object') throw new Error('سیاست نامعتبر است.')

      // Server-side sanity clamps — never trust admin UI values blindly.
      function clampInt(value: unknown, min: number, max: number): number {
        const n = Math.round(Number(value))
        if (!Number.isFinite(n)) throw new Error('مقدار عددی نامعتبر است.')
        return Math.min(max, Math.max(min, n))
      }

      const verified = {
        min_graded_questions: clampInt(policy.verified?.min_graded_questions ?? 200, 1, 10_000),
        min_completed_exams: clampInt(policy.verified?.min_completed_exams ?? 5, 1, 1_000),
        min_projects: clampInt(policy.verified?.min_projects ?? 3, 0, 100),
        min_score: clampInt(policy.verified?.min_score ?? 70, 0, 100),
      }
      const emerging = {
        min_graded_questions: clampInt(policy.emerging?.min_graded_questions ?? 30, 0, 10_000),
        min_completed_exams: clampInt(policy.emerging?.min_completed_exams ?? 1, 0, 1_000),
        min_score: clampInt(policy.emerging?.min_score ?? 50, 0, 100),
      }
      if (
        verified.min_graded_questions < emerging.min_graded_questions ||
        verified.min_score < emerging.min_score
      ) {
        throw new Error('آستانه «تأییدشده» باید از آستانه «در حال شکل‌گیری» سخت‌گیرانه‌تر باشد.')
      }

      const { data: rule } = await svc
        .from('evaluation_rules')
        .select('id')
        .eq('name', 'skill_verification')
        .maybeSingle()
      if (!rule) throw new Error('قانون skill_verification یافت نشد.')

      const { data: last } = await svc
        .from('rule_versions')
        .select('version, conditions')
        .eq('rule_id', rule.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      const prevConditions = (last?.conditions ?? {}) as Record<string, unknown>

      const { error } = await svc.from('rule_versions').insert({
        rule_id: rule.id,
        version: (last?.version ?? 0) + 1,
        conditions: { ...prevConditions, verified, emerging },
        actions: {},
      })
      if (error) throw new Error(`policy save: ${error.message}`)
      return { ok: true, version: (last?.version ?? 0) + 1 }
    }

    // ---- Visibility toggle -------------------------------------------------
    const viewType = String(body.view_type ?? '')
    const sectionKey = String(body.section_key ?? '')
    if (!VIEWS.has(viewType) || !sectionKey) throw new Error('پارامتر نامعتبر است.')

    const { error } = await svc
      .from('resume_visibility_rules')
      .update({ enabled: body.enabled === true, updated_at: new Date().toISOString() })
      .eq('view_type', viewType)
      .eq('section_key', sectionKey)
    if (error) throw new Error(`rule update: ${error.message}`)
    return { ok: true }
  })
}
