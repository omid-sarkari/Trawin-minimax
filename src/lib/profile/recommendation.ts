/**
 * Deterministic, explainable recommendation engine (p3.md §33-§34).
 *
 * NOT an AI system — explicit rules over onboarding answers + verified
 * skill state + published exams. An AI layer can replace `recommendNext`
 * later without touching the dashboard.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Db = SupabaseClient<Database>

export interface Recommendation {
  examId: number | null
  title: string
  reason: string
  /** Which rule produced this — kept for explainability/debuggability. */
  rule: 'primary_technology' | 'weak_skill' | 'fallback_published'
}

interface OnboardingContext {
  primaryTechnologyId: number | null
  targetRole: string | null
}

/**
 * Picks the next best published assessment:
 *   1. A published exam whose track/technology matches the developer's
 *      declared primary technology that they have not completed yet.
 *   2. Otherwise the weakest scored technology area with a matching exam.
 *   3. Otherwise any published exam (newest first).
 */
export async function recommendNextAssessment(
  db: Db,
  appUserId: string,
  onboarding: OnboardingContext,
): Promise<Recommendation> {
  const { data: exams } = await db
    .from('exams')
    .select('id, title, track_id')
    .eq('status', 'published')
    .order('id', { ascending: false })
    .limit(50)

  const published = exams ?? []
  if (published.length === 0) {
    return { examId: null, title: '', reason: 'هنوز آزمونی منتشر نشده است.', rule: 'fallback_published' }
  }

  // Exams already completed by this user (canonical session data).
  const { data: doneRows } = await db
    .from('exam_sessions')
    .select('exam_id')
    .eq('user_id', appUserId)
    .eq('status', 'completed')
  const completedExams = new Set((doneRows ?? []).map((r) => r.exam_id))

  // Rule 1 — declared primary technology via track → track_technologies.
  if (onboarding.primaryTechnologyId) {
    const { data: trackLinks } = await db
      .from('track_technologies')
      .select('track_id')
      .eq('technology_id', onboarding.primaryTechnologyId)
    const techTrackIds = new Set((trackLinks ?? []).map((t) => t.track_id))

    const match = published.find(
      (e) => e.track_id != null && techTrackIds.has(e.track_id) && !completedExams.has(e.id),
    )
    if (match) {
      return {
        examId: match.id,
        title: match.title,
        reason: 'بر اساس تکنولوژی اصلی که در آنبردینگ انتخاب کردی.',
        rule: 'primary_technology',
      }
    }
  }

  // Rule 2 — weakest evidenced skill with a matching-track exam.
  const { data: weakSkill } = await db
    .from('skill_scores')
    .select('score, skills(technology_id)')
    .eq('evaluations.user_id', appUserId)
    .order('score', { ascending: true, nullsFirst: false })
    .limit(5)

  for (const row of (weakSkill ?? []) as Array<{
    score: number | null
    skills: { technology_id: number } | Array<{ technology_id: number }> | null
  }>) {
    const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills
    if (!skill?.technology_id || (row.score ?? 100) >= 70) continue

    const { data: links } = await db
      .from('track_technologies')
      .select('track_id')
      .eq('technology_id', skill.technology_id)
    const trackIds = new Set((links ?? []).map((l) => l.track_id))
    const match = published.find(
      (e) => e.track_id != null && trackIds.has(e.track_id) && !completedExams.has(e.id),
    )
    if (match) {
      return {
        examId: match.id,
        title: match.title,
        reason: `نمره این حوزه ${row.score ?? '—'} است؛ تمرین بیشتر پیشنهاد می‌شود.`,
        rule: 'weak_skill',
      }
    }
  }

  // Rule 3 — fallback.
  const fallback = published.find((e) => !completedExams.has(e.id)) ?? published[0]
  return {
    examId: fallback.id,
    title: fallback.title,
    reason: completedExams.has(fallback.id)
      ? 'برای تثبیت دانش، یک بار دیگر تلاش کن.'
      : 'یک آزمون منتشرشده برای شروع.',
    rule: 'fallback_published',
  }
}
