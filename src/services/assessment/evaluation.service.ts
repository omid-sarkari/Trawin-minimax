/**
 * Evaluation Engine (spec §17-§18, §31-§34).
 *
 * Evaluator registry — business logic lives here, never in components.
 *   MultipleChoiceEvaluator / FillBlankEvaluator → deterministic contract
 *     comparison against the pinned question content.
 *   OpenEndedEvaluator → pending_review (excluded from scoring) until a
 *     real AI/manual kernel is connected.
 *   Coding/DebuggingEvaluator → derived from stored execution results;
 *     Judge0 is never called during finalization.
 *
 * Aggregation: overall_score is the weight-based percentage over gradable
 * questions; unanswered gradable questions count as earned=0. Historical
 * evaluations record the engine version that produced them.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'
import type { QuestionType } from '@/lib/assessment/types'
import { updateSkillStates } from '@/services/assessment/skill-scoring.service'

type Db = SupabaseClient<Database>
type Json = Database['public']['Tables']['answer_evaluations']['Insert']['result']

// ---------------------------------------------------------------------------
// Normalization utilities (shared by text evaluators)
// ---------------------------------------------------------------------------

/** Persian/Arabic aware answer normalization for fill-blank comparisons. */
export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, '\u06CC') // ي ی → ی
    .replace(/\u0643/g, '\u06A9') // ك → ک
    .replace(/[\u0623\u0625\u0622]/g, '\u0627') // أ إ آ → ا
    .replace(/\u200c/g, ' ') // ZWNJ → space
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\s+/g, ' ')
}

export function mcqIsCorrect(content: unknown, selectedOptionId: string): boolean | null {
  if (!content || typeof content !== 'object') return null
  const c = content as { options?: Array<{ id?: unknown; is_correct?: unknown }> }
  if (!Array.isArray(c.options)) return null
  const correct = c.options.find((o) => o.is_correct === true && typeof o.id === 'string')
  if (!correct) return null
  return String(correct.id).toUpperCase() === selectedOptionId.toUpperCase()
}

export function fillBlankIsCorrect(content: unknown, value: string): boolean | null {
  const c = content as { accepted_answers?: unknown }
  if (!Array.isArray(c.accepted_answers)) return null
  const normalizedInput = normalizeText(value)
  return c.accepted_answers.some(
    (a) => typeof a === 'string' && normalizeText(a) === normalizedInput,
  )
}

// ---------------------------------------------------------------------------
// Session evaluation pipeline
// ---------------------------------------------------------------------------

interface AnswerRow {
  id: number
  question_id: number
  answer_data: Record<string, unknown> | null
  question_version_id: number | null
}

interface PinnedQuestion {
  questionId: number
  type: QuestionType
  content: Record<string, unknown>
  weight: number
  explanation: string | null
}

const GRADABLE_TYPES: readonly QuestionType[] = ['multiple_choice', 'fill_blank', 'coding', 'debugging']
const LEVEL_THRESHOLDS: Array<{ min: number; level: string }> = [
  { min: 85, level: 'expert' },
  { min: 70, level: 'senior' },
  { min: 50, level: 'mid' },
]

/**
 * Evaluates every answer of the session, persists per-answer evaluations,
 * aggregates the overall evaluation + skill scores and returns the score.
 */
export async function evaluateSession(db: Db, sessionId: string): Promise<{ score: number | null }> {
  const { data: answers, error } = await db
    .from('answers')
    .select('id, question_id, answer_data, question_version_id')
    .eq('session_id', sessionId)
  if (error) throw new AssessmentError('EVALUATION_ERROR', `answers load: ${error.message}`)
  const answerRows = (answers ?? []) as unknown as AnswerRow[]

  const { data: sessionExam } = await db
    .from('exam_sessions')
    .select('exam_id, user_id')
    .eq('id', sessionId)
    .maybeSingle()
  const examId = sessionExam?.exam_id ?? null
  const appUserId = sessionExam?.user_id

  // Weight map from exam_questions (defaults handled defensively).
  let weights = new Map<number, number>()
  if (examId) {
    const { data: eqRows } = await db
      .from('exam_questions')
      .select('question_id, weight')
      .eq('exam_id', examId)
      .in('question_id', answerRows.map((a) => a.question_id).length ? answerRows.map((a) => a.question_id) : [-1])
    weights = new Map((eqRows ?? []).map((r) => [r.question_id, r.weight ?? 1]))
  }

  // Version contents for grading contracts.
  const versionIds = [...new Set(answerRows.map((a) => a.question_version_id).filter((v): v is number => typeof v === 'number'))]
  const { data: versions } = await db
    .from('question_versions')
    .select('id, content')
    .in('id', versionIds.length ? versionIds : [-1])
  const contentByVersion = new Map(
    (versions ?? []).map((v) => [v.id, (v.content ?? {}) as Record<string, unknown>]),
  )

  // Pre-existing coding/debugging evaluations (written by code-execution).
  const codingVerdicts = await loadCodingVerdicts(db, sessionId)

  // ---- Per-answer evaluation --------------------------------------------
  interface GradedItem {
    questionId: number
    earned: number
    gradable: boolean
    difficulty: number | null
    skills: Array<{ skillId: number; weight: number }>
  }

  const graded: GradedItem[] = []

  for (const answer of answerRows) {
    const { data: question } = await db
      .from('questions')
      .select('id, type, difficulty, question_skills(skill_id, weight)')
      .eq('id', answer.question_id)
      .maybeSingle()
    if (!question) continue

    const type = question.type as QuestionType
    const difficulty = typeof question.difficulty === 'number' ? question.difficulty : null
    const skills = ((question.question_skills ?? []) as Array<{ skill_id: number; weight: number | null }>).map(
      (s) => ({ skillId: s.skill_id, weight: s.weight ?? 1 }),
    )

    const content =
      (answer.question_version_id != null ? contentByVersion.get(answer.question_version_id) : undefined) ?? {}
    const verdictFromCoding = codingVerdicts.get(answer.question_id)

    let outcome: 'correct' | 'incorrect' | 'pending_review' | 'not_graded'
    let explanation: string | null = null
    let earned: number | null = null

    switch (type) {
      case 'multiple_choice': {
        const selected = answer.answer_data?.selected_option_id
        const correct = typeof selected === 'string' ? mcqIsCorrect(content, selected) : false
        outcome = correct ? 'correct' : 'incorrect'
        earned = outcome === 'correct' ? 1 : 0
        break
      }
      case 'fill_blank': {
        const value = answer.answer_data?.value
        const correct = typeof value === 'string' ? fillBlankIsCorrect(content, value) : false
        outcome = correct ? 'correct' : 'incorrect'
        earned = outcome === 'correct' ? 1 : 0
        break
      }
      case 'open_ended': {
        outcome = 'pending_review' // excluded from score until a kernel exists
        earned = null
        break
      }
      default: {
        if (verdictFromCoding === 'correct') {
          outcome = 'correct'
          earned = 1
        } else if (verdictFromCoding === 'incorrect') {
          outcome = 'incorrect'
          earned = 0
        } else {
          // No successful execution on record (provider outage etc.) —
          // never counted against the user (spec §24).
          outcome = 'not_graded'
          earned = null
          explanation = 'اجرای کد ثبت نشده؛ این سؤال در نمره نهایی لحاظ نمی‌شود.'
        }
      }
    }

    await persistAnswerEvaluation(db, answer.id, type, outcome, explanation)
    graded.push({
      questionId: answer.question_id,
      earned: earned ?? 0,
      gradable: earned !== null,
      difficulty,
      skills,
    })
  }

  // ---- Aggregate ----------------------------------------------------------
  let weightedEarned = 0
  let weightedMax = 0
  for (const item of graded) {
    if (!item.gradable) continue
    const w = weights.get(item.questionId) ?? 1
    weightedEarned += item.earned * w
    weightedMax += w
  }
  const score = weightedMax > 0 ? Math.round((weightedEarned / weightedMax) * 100) : null
  const confidence = graded.length > 0 ? Math.round((graded.filter((g) => g.gradable).length / graded.length) * 100) / 100 : 0
  const level = score === null ? null : LEVEL_THRESHOLDS.find((t) => score >= t.min)?.level ?? 'junior'

  await persistOverallEvaluation(db, sessionId, appUserId, score, level, confidence)
  await persistSkillScores(db, sessionId, graded, weights)
  if (appUserId) await updateSkillStates(db, appUserId, graded)

  return { score }
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function persistAnswerEvaluation(
  db: Db,
  answerId: number,
  type: QuestionType,
  outcome: 'correct' | 'incorrect' | 'pending_review' | 'not_graded',
  explanation: string | null,
): Promise<void> {
  // Replace prior evaluation rows so re-runs stay idempotent.
  await db.from('answer_evaluations').delete().eq('answer_id', answerId)
  const result: Json = {
    outcome,
    ...(explanation ? { explanation } : {}),
    graded_by: `${type}_evaluator`,
  }
  await db.from('answer_evaluations').insert({
    answer_id: answerId,
    evaluator_type: `${type}_evaluator`,
    result,
  })
}

/** Loads pre-computed coding outcomes keyed by question id. */
async function loadCodingVerdicts(db: Db, sessionId: string): Promise<Map<number, 'correct' | 'incorrect'>> {
  const { data } = await db
    .from('answers')
    .select('question_id, id')
    .eq('session_id', sessionId)
  const answers = (data ?? []) as Array<{ question_id: number; id: number }>
  if (answers.length === 0) return new Map()

  const { data: evals } = await db
    .from('answer_evaluations')
    .select('answer_id, result')
    .in('answer_id', answers.map((a) => a.id))
  const byAnswerId = new Map((evals ?? []).map((e) => [e.answer_id, e.result as Record<string, unknown>]))

  const out = new Map<number, 'correct' | 'incorrect'>()
  for (const a of answers) {
    const result = byAnswerId.get(a.id)
    const outcome = result?.outcome
    if (outcome === 'correct') out.set(a.question_id, 'correct')
    else if (outcome === 'incorrect') out.set(a.question_id, 'incorrect')
  }
  return out
}

async function persistOverallEvaluation(
  db: Db,
  sessionId: string,
  appUserId: string | null | undefined,
  score: number | null,
  level: string | null,
  confidence: number,
): Promise<void> {
  const { data: engine } = await db
    .from('engine_versions')
    .select('id')
    .eq('active', true)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Idempotent per session: replace any prior overall row for this session.
  await db.from('evaluations').delete().eq('session_id', sessionId)
  const { error } = await db.from('evaluations').insert({
    session_id: sessionId,
    user_id: appUserId!,
    overall_score: score,
    level,
    confidence,
    engine_version_id: engine?.id ?? null,
  })
  if (error) throw new AssessmentError('EVALUATION_ERROR', `evaluation insert: ${error.message}`)
}

async function persistSkillScores(
  db: Db,
  sessionId: string,
  graded: Array<{ questionId: number; earned: number; gradable: boolean; skills: Array<{ skillId: number; weight: number }> }>,
  weights: Map<number, number>,
): Promise<void> {
  const { data: evRow } = await db
    .from('evaluations')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (!evRow) return

  // Aggregate per skill across all gradable contributions.
  interface Acc { num: number; den: number }
  const acc = new Map<number, Acc>()
  for (const item of graded) {
    if (!item.gradable) continue
    const qWeight = weights.get(item.questionId) ?? 1
    for (const s of item.skills) {
      const entry = acc.get(s.skillId) ?? { num: 0, den: 0 }
      const contribution = s.weight * qWeight
      entry.num += item.earned * contribution
      entry.den += contribution
      acc.set(s.skillId, entry)
    }
  }

  await db.from('skill_scores').delete().eq('evaluation_id', evRow.id)
  const rows = [...acc.entries()].map(([skillId, a]) => ({
    evaluation_id: evRow.id,
    skill_id: skillId,
    score: a.den > 0 ? Math.round((a.num / a.den) * 100) : null,
    confidence: a.den > 0 ? Math.min(1, a.den / 10) : 0,
    metadata: { source: 'assessment-runtime-v1' },
  }))
  if (rows.length > 0) await db.from('skill_scores').insert(rows)
}
