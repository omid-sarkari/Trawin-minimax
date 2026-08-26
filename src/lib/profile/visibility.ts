/**
 * Resume visibility enforcement (p3.md §11, §25, §35).
 *
 * The resume_visibility_rules table is the single source of truth. The
 * SERVER filters sections by these rules before anything reaches the
 * browser — company/public views never receive hidden fields at all.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Db = SupabaseClient<Database>

export type ResumeViewType = 'developer' | 'company' | 'pro'

export interface VisibilityRule {
  section_key: string
  label: string
  enabled: boolean
  sort_order: number
}

export async function loadVisibilityRules(
  db: Db,
  viewType: ResumeViewType,
): Promise<Map<string, VisibilityRule>> {
  const { data, error } = await db
    .from('resume_visibility_rules')
    .select('section_key, label, enabled, sort_order')
    .eq('view_type', viewType)
    .order('sort_order')

  if (error) throw new Error(`[visibility] ${error.message}`)
  const map = new Map<string, VisibilityRule>()
  for (const row of data ?? []) map.set(row.section_key, row as VisibilityRule)
  return map
}

export function isSectionAllowed(
  rules: Map<string, VisibilityRule>,
  key: string,
): boolean {
  return rules.get(key)?.enabled ?? false
}

/** Strips every disallowed key from a payload object (server-side gate). */
export function filterByRules<T extends Record<string, unknown>>(
  payload: T,
  rules: Map<string, VisibilityRule>,
): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (isSectionAllowed(rules, key)) out[key as keyof T] = value as T[keyof T]
  }
  return out
}
