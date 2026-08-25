/**
 * Question Selection Engine (spec §5-§7).
 *
 * Strategies decide WHICH questions a session receives. The runtime never
 * contains hardcoded selection logic and the browser never decides.
 * Every served decision is persisted to `question_selection_events`
 * together with the exact pinned `question_versions.id` (stored inside the
 * `selection_reason` JSONB) so historical results stay reproducible.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  SelectedQuestion,
  SelectionContext,
  QuestionSelectionStrategy,
} from '@/lib/assessment/types'
import { AssessmentError } from '@/lib/assessment/errors'

type Db = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Fixed strategy — deterministic order from exam_questions
// ---------------------------------------------------------------------------

export class FixedSelectionStrategy implements QuestionSelectionStrategy {
  readonly mode = 'fixed' as const

  async select(db: Db, ctx: SelectionContext): Promise<SelectedQuestion[]> {
    const { data: rows, error } = await db
      .from('exam_questions')
      .select(
        `question_id,
         question_order,
         weight,
         questions!inner(id, status)`
      )
      .eq('exam_id', ctx.examId)
      .order('question_order', { ascending: true })
    if (error) throw new AssessmentError('INTERNAL_ERROR', `selection: ${error.message}`)

    // Defensive re-sort: never rely solely on DB row ordering.
    const selected = (await pinLatestVersions(db, rows ?? [])).sort(
      (a, b) => a.order - b.order || a.questionId - b.questionId,
    )
    return ctx.targetCount ? selected.slice(0, ctx.targetCount) : selected
  }
}

// ---------------------------------------------------------------------------
// Adaptive strategy — safe deterministic MVP (spec §36)
//
// Orders eligible published questions easiest-first as a deterministic
// placeholder. The real Elo-driven algorithm plugs in behind this same
// interface without touching the runtime.
// ---------------------------------------------------------------------------

export class AdaptiveSelectionStrategy implements QuestionSelectionStrategy {
  readonly mode = 'adaptive' as const

  async select(db: Db, ctx: SelectionContext): Promise<SelectedQuestion[]> {
    const limit = ctx.targetCount ?? 20
    const { data: rows, error } = await db
      .from('questions')
      .select('id, difficulty')
      .eq('status', 'published')
      .order('difficulty', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .limit(limit)
    if (error) throw new AssessmentError('INTERNAL_ERROR', `adaptive selection: ${error.message}`)

    return pinLatestVersionsFromQuestions(db, rows ?? [])
  }
}

// ---------------------------------------------------------------------------
// Version pinning helpers
// ---------------------------------------------------------------------------

interface ExamQuestionRow {
  question_id: number
  question_order: number
  weight: number | null
  questions: { id: number; status: string | null } | null
}

/**
 * Resolves each exam question to its latest existing version and enforces
 * that only published questions are ever served.
 */
async function pinLatestVersions(db: Db, rows: ExamQuestionRow[]): Promise<SelectedQuestion[]> {
  const eligible = rows.filter((r) => r.questions?.status === 'published')
  if (eligible.length === 0) return []

  const versions = await resolveVersionIds(
    db,
    eligible.map((r) => r.question_id),
  )

  return eligible.flatMap((r) => {
    const versionId = versions.get(r.question_id)
    if (!versionId) return []
    return [
      {
        questionId: r.question_id,
        versionId,
        order: r.question_order,
        weight: r.weight ?? 1,
        mode: 'fixed' as const,
      },
    ]
  })
}

interface PlainQuestionRow {
  id: number
  difficulty: number | null
}

async function pinLatestVersionsFromQuestions(db: Db, rows: PlainQuestionRow[]): Promise<SelectedQuestion[]> {
  const versions = await resolveVersionIds(
    db,
    rows.map((r) => r.id),
  )
  return rows.flatMap((r, i) => {
    const versionId = versions.get(r.id)
    if (!versionId) return []
    return [
      {
        questionId: r.id,
        versionId,
        order: i + 1,
        weight: 1,
        mode: 'adaptive' as const,
      },
    ]
  })
}

/** question_id → latest question_versions.id (single indexed round-trip). */
async function resolveVersionIds(db: Db, questionIds: number[]): Promise<Map<number, number>> {
  if (questionIds.length === 0) return new Map()
  const { data, error } = await db
    .from('question_versions')
    .select('id, question_id, version')
    .in('question_id', questionIds)
    .order('version', { ascending: true })
  if (error) throw new AssessmentError('INTERNAL_ERROR', `versions: ${error.message}`)

  // Ascending order → last write per question wins with the highest version.
  const map = new Map<number, number>()
  for (const row of data ?? []) map.set(row.question_id, row.id)
  return map
}

// ---------------------------------------------------------------------------
// Strategy registry + persistence
// ---------------------------------------------------------------------------

export function getSelectionStrategy(mode: string | null | undefined): QuestionSelectionStrategy {
  switch (mode) {
    case 'adaptive':
      return new AdaptiveSelectionStrategy()
    case 'fixed':
    case null:
    case undefined:
      return new FixedSelectionStrategy()
    default:
      return new FixedSelectionStrategy()
  }
}

export interface SelectionEventRow {
  user_id: string
  session_id: string
  exam_id: number | null
  question_id: number
  skill_id: number | null
  selection_mode: string
  selection_reason: Record<string, unknown>
  candidate_score: number | null
}

/**
 * Persists every served decision BEFORE the client sees it (spec §7).
 * `user_id` here is the AUTH identity — question_selection_events FKs
 * reference auth.users, unlike most application tables.
 */
export async function persistSelectionEvents(
  db: Db,
  authUserId: string,
  sessionId: string,
  examId: number | null,
  selected: SelectedQuestion[],
): Promise<void> {
  if (selected.length === 0) return
  const rows = selected.map((s) => ({
    user_id: authUserId,
    session_id: sessionId,
    exam_id: examId,
    question_id: s.questionId,
    skill_id: null as number | null,
    selection_mode: s.mode,
    selection_reason: {
      strategy: s.mode === 'fixed' ? 'fixed-order' : 'adaptive-mvp-easy-first',
      question_version_id: s.versionId,
      order: s.order,
      weight: s.weight,
    },
    candidate_score: null as number | null,
  }))
  const { error } = await db.from('question_selection_events').insert(rows)
  if (error) throw new AssessmentError('INTERNAL_ERROR', `persist selection: ${error.message}`)
}

/**
 * Loads the authoritative, already-persisted selection for an active
 * session. This — not the current exam_questions table — defines what the
 * session serves, so admin edits mid-session cannot mutate it (spec §48/49).
 */
export async function loadPinnedSelection(
  db: Db,
  sessionId: string,
): Promise<SelectedQuestion[]> {
  const { data, error } = await db
    .from('question_selection_events')
    .select('question_id, selection_mode, selection_reason')
    .eq('session_id', sessionId)
    .order('id', { ascending: true })
  if (error) throw new AssessmentError('INTERNAL_ERROR', `load selection: ${error.message}`)

  const out: SelectedQuestion[] = []
  for (const row of data ?? []) {
    const reason = (row.selection_reason ?? {}) as Record<string, unknown>
    const versionId = Number(reason.question_version_id)
    if (!Number.isInteger(versionId)) continue // defensive: legacy rows without pins
    out.push({
      questionId: row.question_id,
      versionId,
      order: Number(reason.order ?? out.length + 1),
      weight: Number(reason.weight ?? 1),
      mode: row.selection_mode === 'adaptive' ? 'adaptive' : 'fixed',
    })
  }
  return out.sort((a, b) => a.order - b.order || a.questionId - b.questionId)
}
