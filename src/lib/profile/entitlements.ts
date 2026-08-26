/**
 * Centralized entitlement/feature system (p3.md §12, §30).
 *
 * Feature → Plan → Entitlement → User. Components never check
 * `user.plan === 'pro'` themselves; they ask this service.
 *
 * The smallest clean abstraction: plans + user_plans tables. A real billing
 * integration later only needs to write user_plans rows — nothing here
 * changes.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Db = SupabaseClient<Database>

export type Entitlement =
  | 'advanced_analytics'
  | 'rich_sections'
  | 'advanced_insights'

/** Pro plan grants every pro entitlement (rules table can narrow later). */
const PRO_ENTITLEMENTS: readonly Entitlement[] = [
  'advanced_analytics',
  'rich_sections',
  'advanced_insights',
]

export interface UserPlanInfo {
  plan: 'free' | 'pro'
  expiresAt: string | null
}

export class EntitlementService {
  constructor(private db: Db) {}

  /** Reads the user's effective plan; defaults to free on any gap. */
  async getPlan(appUserId: string): Promise<UserPlanInfo> {
    const { data } = await this.db
      .from('user_plans')
      .select('ends_at, plans!inner(code, active)')
      .eq('user_id', appUserId)
      .maybeSingle()

    if (!data) return { plan: 'free', expiresAt: null }
    const row = data as unknown as {
      ends_at: string | null
      plans: { code: string; active: boolean }
    }
    // An expired grant silently degrades to free — no hard failures.
    const expired = row.ends_at ? new Date(row.ends_at).getTime() < Date.now() : false
    if (!row.plans.active || expired || row.plans.code !== 'pro') {
      return { plan: 'free', expiresAt: row.ends_at }
    }
    return { plan: 'pro', expiresAt: row.ends_at }
  }

  async has(entitlement: Entitlement, appUserId: string): Promise<boolean> {
    const { plan } = await this.getPlan(appUserId)
    if (plan === 'free') return false
    return PRO_ENTITLEMENTS.includes(entitlement)
  }

  async setPlan(
    targetAppUserId: string,
    planCode: 'free' | 'pro',
    grantedBy: string | null,
  ): Promise<void> {
    const { data: plan } = await this.db
      .from('plans')
      .select('id')
      .eq('code', planCode)
      .eq('active', true)
      .maybeSingle()
    if (!plan) throw new Error(`plan ${planCode} missing`)

    if (planCode === 'free') {
      await this.db.from('user_plans').delete().eq('user_id', targetAppUserId)
      return
    }

    await this.db.from('user_plans').upsert(
      { user_id: targetAppUserId, plan_id: plan.id, granted_by: grantedBy },
      { onConflict: 'user_id' },
    )
  }
}
