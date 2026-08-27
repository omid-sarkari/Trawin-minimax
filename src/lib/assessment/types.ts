/**
 * Trawin Assessment Runtime — shared server-side contracts.
 *
 * These types describe the authoritative server view of a session and the
 * sanitized payloads the browser is allowed to receive (spec §16, §45).
 * Correct answers, hidden test cases, evaluator internals and credentials
 * must never be attached to any `Client*` type.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type ExamStatus = NonNullable<Database['public']['Tables']['exams']['Row']['status']>
export type SessionStatus = NonNullable<Database['public']['Tables']['exam_sessions']['Row']['status']>
export type QuestionType = Database['public']['Tables']['questions']['Row']['type']

/** Valid session state machine edges (spec §9). */
export const SESSION_TRANSITIONS: Record<Exclude<SessionStatus, null>, readonly SessionStatus[]> = {
  started: ['submitted', 'evaluating', 'cancelled'],
  submitted: ['evaluating', 'cancelled'],
  evaluating: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function canTransition(from: SessionStatus | null, to: SessionStatus | null): boolean {
  const key = (from ?? 'started') as Exclude<SessionStatus, null>
  return SESSION_TRANSITIONS[key]?.includes(to ?? ('started' as SessionStatus)) ?? false
}

// ---------------------------------------------------------------------------
// JSON helpers (Supabase `Json` is stricter than Record<string, unknown>)
// ---------------------------------------------------------------------------

export type Json = Database['public']['Tables']['answers']['Insert']['answer_data']

/** Casts an arbitrary serializable value to the DB JSON contract. */
export function asJson(value: unknown): Json {
  return value as Json
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** One resolved, version-pinned question inside an active session. */
export interface SelectedQuestion {
  questionId: number
  /** Exact question_versions.id served — immutable for the session lifetime. */
  versionId: number
  order: number
  weight: number
  mode: 'fixed' | 'adaptive'
}

export interface SelectionContext {
  examId: number
  targetCount: number | null
  config: Record<string, unknown>
}

export interface QuestionSelectionStrategy {
  readonly mode: 'fixed' | 'adaptive'
  /** `db` is the privileged server client provided by the caller. */
  select(db: SupabaseClient<Database>, ctx: SelectionContext): Promise<SelectedQuestion[]>
}

// ---------------------------------------------------------------------------
// Client-facing (sanitized) payloads
// ---------------------------------------------------------------------------

export interface PublicTestCase {
  name: string
  input: string
  expected_output: string
}

/** Question content exactly as the browser may see it. */
export interface ClientQuestion {
  id: number
  order: number
  weight: number
  type: QuestionType
  title: string | null
  difficulty: number | null
  language: string | null
  body: string
  starterCode?: string
  buggyCode?: string
  examples: Array<{ input: string; output: string }>
  constraints: string[]
  /** MCQ options WITHOUT correctness flags. */
  options?: Array<{ id: string; text: string }>
}

export interface ClientAnswerEcho {
  questionId: number
  answerData: Record<string, unknown>
  timeSpentSeconds: number | null
}

export interface ClientSessionState {
  sessionId: string
  examId: number
  examTitle: string
  status: Exclude<SessionStatus, null>
  /** Server-computed remaining seconds at response time (display only). */
  remainingSeconds: number | null
  totalDurationSeconds: number | null
  questions: ClientQuestion[]
  answers: ClientAnswerEcho[]
  currentIndex: number
}

export interface ClientResult {
  sessionId: string
  status: Exclude<SessionStatus, null>
  score: number | null
  level: string | null
  confidence: number | null
  items: Array<{
    questionId: number
    type: QuestionType
    outcome: 'correct' | 'incorrect' | 'pending_review' | 'not_graded'
    explanation?: string | null
  }>
}
