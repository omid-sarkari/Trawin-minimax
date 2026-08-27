/**
 * Exam Session Runtime (spec §8-§14, §37-§38).
 *
 * The exam session row is the ONLY authoritative representation of an
 * attempt. Browser state, timers and localStorage are display-only.
 *
 * Concurrency model: every transition is a conditional UPDATE guarded by
 * the expected current status; the number of affected rows decides the
 * winner. Double submits and refresh races therefore converge safely
 * without JS locks.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'
import {
  getSelectionStrategy,
  loadPinnedSelection,
  persistSelectionEvents,
} from '@/services/assessment/question-selection.service'
import { sanitizeQuestionForClient } from '@/services/assessment/question-delivery.service'
import { evaluateSession } from '@/services/assessment/evaluation.service'
import type {
  ClientQuestion,
  ClientResult,
  ClientSessionState,
  SelectedQuestion,
} from '@/lib/assessment/types'

type Db = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

interface SessionRow {
  id: string
  exam_id: number
  user_id: string
  status: string | null
  started_at: string | null
  finished_at: string | null
  score: number | null
}

interface ExamRow {
  id: number
  title: string
  slug: string
  status: string | null
  duration_minutes: number | null
}

const ACTIVE_STATUSES = ['started', 'submitted', 'evaluating'] as const
/** A finalize that has been stuck in `evaluating` longer than this is retried. */
const EVALUATING_STALE_MS = 2 * 60 * 1000

function asSession(row: Record<string, unknown> | null): SessionRow | null {
  if (!row) return null
  return row as unknown as SessionRow
}

// ---------------------------------------------------------------------------
// Start exam — idempotent create-or-recover
// ---------------------------------------------------------------------------

export async function startExam(
  db: Db,
  ids: { appUserId: string; authUserId: string },
  examIdOrSlug: string | number,
): Promise<ClientSessionState> {
  // 1) Load exam.
  const isNumeric = typeof examIdOrSlug === 'number' || /^\d+$/.test(String(examIdOrSlug))
  let query = db.from('exams').select('id, title, slug, status, duration_minutes')
  if (isNumeric) query = query.eq('id', Number(examIdOrSlug))
  else query = query.eq('slug', String(examIdOrSlug))
  const { data: exam, error: examError } = await query.maybeSingle()
  if (examError) throw new AssessmentError('INTERNAL_ERROR', `exam load: ${examError.message}`)
  if (!exam) throw new AssessmentError('SESSION_NOT_FOUND', 'آزمون موردنظر پیدا نشد.')
  if (exam.status !== 'published') {
    throw new AssessmentError('AUTHORIZATION_ERROR', 'این آزمون در حال حاضر قابل شرکت نیست.')
  }

  // 2) Recover an existing active session (refresh / reconnect safety).
  const { data: activeRow } = await db
    .from('exam_sessions')
    .select('*')
    .eq('user_id', ids.appUserId)
    .eq('exam_id', exam.id)
    .in('status', [...ACTIVE_STATUSES])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const active = asSession(activeRow as Record<string, unknown>)
  if (active) return buildSessionState(db, exam, active, ids.authUserId)

  // 3) Create a fresh session.
  const { data: created, error: createError } = await db
    .from('exam_sessions')
    .insert({ exam_id: exam.id, user_id: ids.appUserId, status: 'started' })
    .select('*')
    .single()
  if (createError || !created) {
    throw new AssessmentError('INTERNAL_ERROR', `session create: ${createError?.message}`)
  }

  // 4) Resolve + persist the pinned question set BEFORE serving anything.
  await resolveAndPersistSelection(db, ids.authUserId, created.id, exam.id)

  return buildSessionState(db, exam, created as unknown as SessionRow, ids.authUserId)
}

async function resolveAndPersistSelection(
  db: Db,
  authUserId: string,
  sessionId: string,
  examId: number,
): Promise<void> {
  const { data: configRow } = await db
    .from('exam_selection_configs')
    .select('mode, target_question_count, config, active')
    .eq('exam_id', examId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Only one active config per exam (UNIQUE(exam_id)); defensive fallback.
  const mode = configRow?.active ? configRow.mode : 'fixed'
  const strategy = getSelectionStrategy(mode)
  const selected = await strategy.select(db, {
    examId,
    targetCount: configRow?.target_question_count ?? null,
    config: (configRow?.config ?? {}) as Record<string, unknown>,
  })
  if (selected.length === 0) {
    throw new AssessmentError('VALIDATION_ERROR', 'این آزمون هنوز سؤالی ندارد.')
  }
  await persistSelectionEvents(db, authUserId, sessionId, examId, selected)
}

// ---------------------------------------------------------------------------
// State reconstruction
// ---------------------------------------------------------------------------

export async function getSessionState(
  db: Db,
  ids: { appUserId: string; authUserId: string },
  sessionId: string,
): Promise<{ state?: ClientSessionState; result?: ClientResult }> {
  const { data: row, error } = await db.from('exam_sessions').select('*').eq('id', sessionId).maybeSingle()
  if (error) throw new AssessmentError('INTERNAL_ERROR', `session load: ${error.message}`)
  const session = asSession((row ?? null) as Record<string, unknown>)
  if (!session) throw new AssessmentError('SESSION_NOT_FOUND')
  assertOwnership(session, ids.appUserId)

  const { data: exam } = await db.from('exams').select('*').eq('id', session.exam_id).maybeSingle()
  if (!exam) throw new AssessmentError('INTERNAL_ERROR', 'exam of session missing')

  const expired = isExpired(session, exam.duration_minutes)
  if (expired && session.status === 'started') {
    // Lazy server-side expiration → same finalization path as manual submit.
    const result = await finalizeSession(db, sessionId, { auto: true })
    return { result }
  }

  if (['completed'].includes(session.status ?? '')) return { result: await loadResult(db, session) }

  // A previous finalize crashed mid-evaluation → self-heal by re-running it.
  if (session.status === 'evaluating' && isEvaluatingStale(session)) {
    const result = await finalizeSession(db, sessionId, { resume: true })
    return { result }
  }

  if (session.status !== 'started') return { result: await loadInProgressResult(session) }

  return { state: await buildSessionState(db, exam as unknown as ExamRow, session, ids.authUserId) }
}
function assertOwnership(session: SessionRow, appUserId: string): void {
  if (session.user_id !== appUserId) {
    throw new AssessmentError('AUTHORIZATION_ERROR', 'این جلسه متعلق به شما نیست.')
  }
}

// ---------------------------------------------------------------------------
// Timer authority (spec §13)
// ---------------------------------------------------------------------------

function isExpired(session: SessionRow, durationMinutes: number | null): boolean {
  if (session.status !== 'started') return false
  const remaining = remainingSeconds(session.started_at, durationMinutes)
  return remaining !== null && remaining <= 0
}

/** Server-authoritative remaining time; client countdown is display-only. */
export function remainingSeconds(startedAt: string | null | undefined, durationMinutes: number | null | undefined): number | null {
  if (!durationMinutes || !startedAt) return null
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
  return Math.max(0, Math.round(durationMinutes * 60 - elapsed))
}

function isEvaluatingStale(session: SessionRow): boolean {
  const finished = session.finished_at ? new Date(session.finished_at).getTime() : null
  if (!finished) return true
  return Date.now() - finished > EVALUATING_STALE_MS
}

// ---------------------------------------------------------------------------
// Client payload assembly
// ---------------------------------------------------------------------------

async function buildSessionState(
  db: Db,
  exam: ExamRow,
  session: SessionRow,
  authUserId: string,
): Promise<ClientSessionState> {
  void authUserId
  const pinned = await loadPinnedSelection(db, session.id)

  const { data: versions } = await db
    .from('question_versions')
    .select('id, question_id, title, content, language, test_cases')
    .in('id', pinned.map((p) => p.versionId))
  const versionById = new Map((versions ?? []).map((v) => [v.id, v]))

  const { data: questions } = await db
    .from('questions')
    .select('id, type, difficulty')
    .in('id', pinned.map((p) => p.questionId))
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]))

  const clientQuestions: ClientQuestion[] = []
  for (const pin of pinned) {
    const q = questionById.get(pin.questionId)
    const v = versionById.get(pin.versionId)
    if (!q || !v) continue // defensive skip of dangling pins
    clientQuestions.push(
      sanitizeQuestionForClient(q.type, q.difficulty, pin.order, pin.weight, v),
    )
  }

  const { data: answers } = await db
    .from('answers')
    .select('question_id, answer_data, time_spent_seconds')
    .eq('session_id', session.id)
    .order('question_id')

  const answersList = (answers ?? []).map((a) => ({
    questionId: a.question_id,
    answerData: (a.answer_data ?? {}) as Record<string, unknown>,
    timeSpentSeconds: a.time_spent_seconds,
  }))
  const answeredIds = new Set(answersList.map((a) => a.questionId))

  const durationSeconds = exam.duration_minutes ? exam.duration_minutes * 60 : null

  return {
    sessionId: session.id,
    examId: exam.id,
    examTitle: exam.title,
    status: 'started',
    remainingSeconds: durationSeconds && session.started_at
      ? Math.max(0, Math.round(durationSeconds - (Date.now() - new Date(session.started_at).getTime()) / 1000))
      : null,
    totalDurationSeconds: durationSeconds,
    questions: clientQuestions,
    answers: answersList,
    currentIndex: Math.max(0, clientQuestions.findIndex((q) => !answeredIds.has(q.id))),
  }
}

// ---------------------------------------------------------------------------
// Finalization (spec §37) — manual submit AND auto-expiry converge here
// ---------------------------------------------------------------------------

export async function submitExam(
  db: Db,
  appUserId: string,
  sessionId: string,
): Promise<ClientResult> {
  const { data: row } = await db
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()
  const session = asSession((row ?? null) as Record<string, unknown>)
  if (!session) throw new AssessmentError('SESSION_NOT_FOUND')
  assertOwnership(session, appUserId)

  switch (session.status) {
    case 'completed':
      return loadResult(db, session)
    case 'submitted':
    case 'evaluating':
      // Concurrent submit lost the race — same outcome either way.
      return loadInProgressResult(session)
    case 'cancelled':
      throw new AssessmentError('SESSION_ALREADY_SUBMITTED', 'این جلسه لغو شده است.')
    case 'started':
    default:
      break
  }

  if (isExpired(session, await examDuration(db, session.exam_id))) {
    // Expired while submitting: deterministic winner — expiry finalizes.
    return finalizeSession(db, sessionId, { auto: true })
  }

  return finalizeSession(db, sessionId, {})
}

async function examDuration(db: Db, examId: number): Promise<number | null> {
  const { data } = await db.from('exams').select('duration_minutes').eq('id', examId).maybeSingle()
  return data?.duration_minutes ?? null
}

/**
 * Single transactional-ish finalization path:
 *   started →(conditional update)→ evaluating → evaluate → completed.
 */
async function finalizeSession(
  db: Db,
  sessionId: string,
  opts: { auto?: boolean; resume?: boolean },
): Promise<ClientResult> {
  if (opts.resume) {
    // Re-entry after crash: keep/refresh evaluating marker then continue.
    await db
      .from('exam_sessions')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('status', 'evaluating')
  } else {
    const claimed = await claimForEvaluation(db, sessionId, opts.auto === true)
    if (!claimed) {
      const { data: row } = await db.from('exam_sessions').select('*').eq('id', sessionId).maybeSingle()
      const s = asSession((row ?? null) as Record<string, unknown>)
      if (s && ['submitted', 'evaluating'].includes(s.status ?? '')) return loadInProgressResult(s)
      if (s?.status === 'completed') return loadResult(db, s)
      throw new AssessmentError('SESSION_EXPIRED', 'جلسه قابل ثبت نهایی نبود.')
    }
  }

  try {
    return await runEvaluationAndComplete(db, sessionId)
  } catch (evaluationError) {
    console.error(`[assessment] finalize failed for ${sessionId}:`, evaluationError)
    // Leave the session in `evaluating` — the next state poll retries.
    throw new AssessmentError('EVALUATION_ERROR')
  }
}

/**
 * Atomically claims the started→submitted→evaluating path.
 * `auto=true` also wins over an in-flight manual submit: whichever
 * conditional UPDATE touches a `started` row first is the single driver.
 */
async function claimForEvaluation(db: Db, sessionId: string, auto: boolean): Promise<boolean> {
  const now = new Date().toISOString()

  const submitted = await db
    .from('exam_sessions')
    .update({ status: 'submitted' })
    .eq('id', sessionId)
    .eq('status', 'started')
    .select('id')
  if ((submitted.data?.length ?? 0) === 1) {
    void auto
    const evaluating = await db
      .from('exam_sessions')
      .update({ status: 'evaluating', finished_at: now })
      .eq('id', sessionId)
      .eq('status', 'submitted')
      .select('id')
    return (evaluating.data?.length ?? 0) === 1
  }

  // Row was not `started` anymore — accept an already-claiming session only.
  const { data: row } = await db
    .from('exam_sessions')
    .update({ status: 'evaluating', finished_at: now })
    .eq('id', sessionId)
    .eq('status', 'submitted')
    .select('id')
  return (row?.length ?? 0) === 1
}

async function runEvaluationAndComplete(db: Db, sessionId: string): Promise<ClientResult> {
  const { score } = await evaluateSession(db, sessionId)

  const completed = await db
    .from('exam_sessions')
    .update({ status: 'completed', score, finished_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('status', 'evaluating')
    .select('id, score')
  if ((completed.data?.length ?? 0) !== 1) {
    throw new AssessmentError('INTERNAL_ERROR', 'completion race lost')
  }

  const { data: row } = await db.from('exam_sessions').select('*').eq('id', sessionId).maybeSingle()
  const session = asSession((row ?? null) as Record<string, unknown>)
  if (!session) throw new AssessmentError('SESSION_NOT_FOUND')
  return loadResult(db, session)
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

async function loadInProgressResult(session: SessionRow): Promise<ClientResult> {
  return {
    sessionId: session.id,
    status: (session.status ?? 'submitted') as ClientResult['status'],
    score: null,
    level: null,
    confidence: null,
    items: [],
  }
}

export async function loadResult(db: Db, session: SessionRow): Promise<ClientResult> {
  const { data: evalRows } = await db
    .from('evaluations')
    .select('id, overall_score, level, confidence')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const ev = evalRows?.[0]

  const items: ClientResult['items'] = []
  if (ev) {
    const { data: answerEvalRows } = await db
      .from('answer_evaluations')
      .select('result, evaluator_type, answers!inner(question_id)')
      .eq('answers.session_id', session.id)
    const seen = new Set<number>()
    for (const r of answerEvalRows ?? []) {
      const qid = (r.answers as unknown as { question_id: number }).question_id
      if (seen.has(qid)) continue
      seen.add(qid)
      const result = (r.result ?? {}) as Record<string, unknown>
      items.push({
        questionId: qid,
        type: (r.evaluator_type ?? '').replace('_evaluator', '') as ClientResult['items'][number]['type'],
        outcome: (result.outcome as ClientResult['items'][number]['outcome']) ?? 'not_graded',
        explanation: (result.explanation as string | undefined) ?? null,
      })
    }
  }

  return {
    sessionId: session.id,
    status: 'completed',
    score: ev?.overall_score ?? session.score ?? null,
    level: ev?.level ?? null,
    confidence: ev?.confidence ?? null,
    items,
  }
}
