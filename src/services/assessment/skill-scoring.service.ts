/**
 * Skill Scoring Service (spec §34-§36).
 *
 * Updates the longitudinal `user_skill_states` after a completed session.
 *
 * IMPORTANT identity note: user_skill_states.user_id references
 * AUTH users, while exam_sessions/evaluations use the application-level
 * public.users.id. The caller passes the app id; this service resolves
 * auth_user_id itself so callers cannot mix identities.
 *
 * Algorithm: Elo-lite. Deterministic, isolated from UI, incremental —
 * never overwrites state blindly (spec §35). If a richer algorithm is
 * adopted later it replaces `updateSkillStates` only.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'

type Db = SupabaseClient<Database>

interface SkillContribution {
  skills: Array<{ skillId: number; weight: number }>
  earned: number
  gradable: boolean
  difficulty: number | null
}

/** Maps question difficulty 1..5 onto an Elo opponent rating. */
function difficultyRating(difficulty: number | null): number {
  if (!difficulty || difficulty < 1) return 1000
  return 800 + Math.min(5, difficulty) * 200 // 1000 … 1800
}

export async function updateSkillStates(
  db: Db,
  appUserId: string,
  graded: SkillContribution[],
): Promise<void> {
  const { data: userRow } = await db
    .from('users')
    .select('auth_user_id')
    .eq('id', appUserId)
    .maybeSingle()
  const authUserId = userRow?.auth_user_id
  if (!authUserId) throw new AssessmentError('INTERNAL_ERROR', 'user identity link missing')

  // Aggregate observed performance per skill for THIS session.
  interface Observed {
    num: number
    den: number
    difficultySum: number
    difficultyCount: number
  }
  const observed = new Map<number, Observed>()
  for (const item of graded) {
    if (!item.gradable) continue
    for (const s of item.skills) {
      const o = observed.get(s.skillId) ?? { num: 0, den: 0, difficultySum: 0, difficultyCount: 0 }
      o.num += item.earned * s.weight
      o.den += s.weight
      if (item.difficulty != null) {
        o.difficultySum += item.difficulty * s.weight
        o.difficultyCount += s.weight
      }
      observed.set(s.skillId, o)
    }
  }
  if (observed.size === 0) return

  for (const [skillId, o] of observed) {
    const actual = o.den > 0 ? o.num / o.den : 0
    const avgDifficulty =
      o.difficultyCount > 0 ? Math.round(o.difficultySum / o.difficultyCount) : null

    const { data: existing } = await db
      .from('user_skill_states')
      .select('rating, uncertainty, attempts, correct_count, incorrect_count')
      .eq('user_id', authUserId)
      .eq('skill_id', skillId)
      .maybeSingle()

    const prev = existing ?? { rating: 1000, uncertainty: 350, attempts: 0, correct_count: 0, incorrect_count: 0 }

    const expected = 1 / (1 + 10 ** ((difficultyRating(avgDifficulty) - prev.rating) / 400))
    const kFactor = clamp(32 * (prev.uncertainty / 350), 8, 64)
    let rating = prev.rating + kFactor * (actual - expected)
    if (rating < 0) rating = 0

    const attempts = prev.attempts + 1
    const uncertainty = Math.max(100, prev.uncertainty * 0.95)
    const confidence = Math.min(1, attempts / 20)

    await db.from('user_skill_states').upsert(
      {
        user_id: authUserId,
        skill_id: skillId,
        rating: Math.round(rating * 10) / 10,
        uncertainty: Math.round(uncertainty * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        attempts,
        correct_count: prev.correct_count + (actual >= 0.5 ? 1 : 0),
        incorrect_count: prev.incorrect_count + (actual < 0.5 ? 1 : 0),
        last_evaluated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,skill_id' },
    )
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
