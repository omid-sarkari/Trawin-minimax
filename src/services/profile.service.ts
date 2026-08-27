/**
 * Developer Profile & Onboarding service (p3.md §3-§7, §15-§17).
 *
 * Persistence model (chosen over new tables — §6 reuse rule):
 *   - structured answers → profiles.target_role / work_preference /
 *     primary_technology_id / experience_years / country
 *   - extensible answers + step draft  → profiles.onboarding_data jsonb
 *   - completion flag                  → profiles.onboarding_completed
 *
 * All writes go through the server with the privileged client; ownership
 * is derived from the authenticated session, never from the body.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'
import { asJson } from '@/lib/assessment/types'
import {
  validateUsername,
  normalizeUsername,
} from '@/lib/profile/username-policy'

type Db = SupabaseClient<Database>

export interface OnboardingPayload {
  /** Extensible intent list — stored verbatim in onboarding_data. */
  intents: string[]
  primaryTechnologyId: number | null
  targetRole: string | null
  experienceLevel: string | null
  workPreference: string[]
}

const MAX_INTENTS = 8
const MAX_WORK_PREFS = 6
const EXPERIENCE_LEVELS = new Set(['beginner', 'junior', 'mid', 'senior', 'expert'])
const WORK_PREFS = new Set([
  'remote', 'onsite', 'hybrid', 'freelance', 'full_time', 'part_time', 'internship',
])

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v.length === 0 ? null : v.slice(0, max)
}

export class ProfileService {
  constructor(private db: Db) {}

  // ------------------------------------------------------------------
  // Onboarding
  // ------------------------------------------------------------------

  async getOnboardingState(appUserId: string): Promise<{
    completed: boolean
    data: Record<string, unknown>
    profile: Record<string, unknown> | null
  }> {
    const { data: profile, error } = await this.db
      .from('profiles')
      .select(
        `headline, target_role, work_preference, primary_technology_id,
         onboarding_completed, onboarding_data, full_name, avatar_url, bio,
         country, experience_years`
      )
      .eq('user_id', appUserId)
      .maybeSingle()
    if (error) throw new AssessmentError('INTERNAL_ERROR', `profile: ${error.message}`)

    return {
      completed: profile?.onboarding_completed ?? false,
      data: (profile?.onboarding_data ?? {}) as Record<string, unknown>,
      profile: (profile ?? null) as Record<string, unknown> | null,
    }
  }

  /**
   * Saves one onboarding step (idempotent upsert into onboarding_data) or
   * finalizes the flow. Refresh mid-wizard resumes from persisted steps.
   */
  async saveOnboardingStep(
    appUserId: string,
    stepKey: string,
    payload: Partial<OnboardingPayload>,
    finalize: boolean,
  ): Promise<void> {
    const state = await this.getOnboardingState(appUserId)
    const merged: Record<string, unknown> = { ...state.data }

    if (Array.isArray(payload.intents)) {
      merged.intents = payload.intents
        .filter((i): i is string => typeof i === 'string')
        .slice(0, MAX_INTENTS)
    }

    const patch: Record<string, unknown> = {}
    if ('primaryTechnologyId' in payload) {
      patch.primary_technology_id =
        Number.isInteger(payload.primaryTechnologyId) && payload.primaryTechnologyId! > 0
          ? payload.primaryTechnologyId
          : null
    }
    if ('targetRole' in payload) patch.target_role = clean(payload.targetRole, 60)
    if ('experienceLevel' in payload) {
      const level = clean(payload.experienceLevel, 20)
      if (level && !EXPERIENCE_LEVELS.has(level)) {
        throw new AssessmentError('VALIDATION_ERROR', 'سطح تجربه نامعتبر است.')
      }
      merged.experience_level = level
    }
    if (Array.isArray(payload.workPreference)) {
      const prefs = payload.workPreference.filter((w): w is string => WORK_PREFS.has(w))
      if (prefs.length !== payload.workPreference.length) {
        throw new AssessmentError('VALIDATION_ERROR', 'ترجیح کاری نامعتبر است.')
      }
      patch.work_preference = prefs.slice(0, MAX_WORK_PREFS)
    }

    merged[`step_${stepKey}`] = { saved_at: new Date().toISOString() }

    const { error } = await this.db
      .from('profiles')
      .update({
        ...patch,
        onboarding_data: asJson(merged),
        ...(finalize ? { onboarding_completed: true } : {}),
      })
      .eq('user_id', appUserId)
    if (error) throw new AssessmentError('INTERNAL_ERROR', `onboarding save: ${error.message}`)
  }

  // ------------------------------------------------------------------
  // Profile editing + username claim (§15-§17)
  // ------------------------------------------------------------------

  async checkUsernameAvailable(input: string): Promise<{ available: boolean; reason?: string }> {
    const validation = validateUsername(input)
    if (!validation.ok || !validation.normalized) {
      return { available: false, reason: validation.reason }
    }
    const { data } = await this.db
      .from('users')
      .select('id')
      .ilike('username', validation.normalized)
      .maybeSingle() // case-insensitive match against the CI unique index
    if (data) return { available: false, reason: 'این نام کاربری قبلاً گرفته شده است.' }
    return { available: true }
  }

  async claimUsername(appUserId: string, input: string): Promise<string> {
    const validation = validateUsername(input)
    if (!validation.ok || !validation.normalized) {
      throw new AssessmentError('VALIDATION_ERROR', validation.reason)
    }
    const normalized = normalizeUsername(validation.normalized)

    const { data: existing } = await this.db
      .from('users')
      .select('id')
      .ilike('username', normalized)
      .neq('id', appUserId)
      .maybeSingle()
    if (existing) throw new AssessmentError('VALIDATION_ERROR', 'این نام کاربری قبلاً گرفته شده است.')

    const { error } = await this.db
      .from('users')
      .update({ username: normalized })
      .eq('id', appUserId)
    if (error) {
      // Unique index violation race → friendly message.
      if (error.code === '23505') {
        throw new AssessmentError('VALIDATION_ERROR', 'این نام کاربری لحظاتی پیش گرفته شد.')
      }
      throw new AssessmentError('INTERNAL_ERROR', `username: ${error.message}`)
    }
    return normalized
  }

  async updateProfile(
    appUserId: string,
    patch: {
      fullName?: unknown
      headline?: unknown
      bio?: unknown
      country?: unknown
      experienceYears?: unknown
      primaryTechnologyId?: unknown
      workPreference?: unknown
      targetRole?: unknown
      avatarUrl?: unknown
    },
  ): Promise<void> {
    const update: Record<string, unknown> = {}

    if ('fullName' in patch) update.full_name = clean(patch.fullName, 80)
    if ('headline' in patch) update.headline = clean(patch.headline, 100)
    if ('bio' in patch) {
      const bio = clean(patch.bio, 2000)
      update.bio = bio
    }
    if ('country' in patch) update.country = clean(patch.country, 40)
    if ('targetRole' in patch) update.target_role = clean(patch.targetRole, 60)
    if ('experienceYears' in patch) {
      const years = Number(patch.experienceYears)
      update.experience_years =
        Number.isFinite(years) && years >= 0 && years <= 60 ? Math.round(years) : null
    }
    if ('primaryTechnologyId' in patch) {
      const techId = Number(patch.primaryTechnologyId)
      update.primary_technology_id =
        Number.isInteger(techId) && techId > 0 ? techId : null
    }
    if (Array.isArray(patch.workPreference)) {
      const prefs = patch.workPreference.filter((w): w is string => WORK_PREFS.has(w))
      if (prefs.length !== patch.workPreference.length) {
        throw new AssessmentError('VALIDATION_ERROR', 'ترجیح کاری نامعتبر است.')
      }
      update.work_preference = prefs.slice(0, MAX_WORK_PREFS)
    }
    if ('avatarUrl' in patch) {
      const url = clean(patch.avatarUrl, 500)
      if (url && !/^https:\/\/[^\s]+$/i.test(url)) {
        throw new AssessmentError('VALIDATION_ERROR', 'آدرس عکس باید با https شروع شود.')
      }
      update.avatar_url = url
    }

    if (Object.keys(update).length === 0) return

    const { error } = await this.db
      .from('profiles')
      .update(update as Database['public']['Tables']['profiles']['Update'])
      .eq('user_id', appUserId)
    if (error) throw new AssessmentError('INTERNAL_ERROR', `profile update: ${error.message}`)
  }
}
