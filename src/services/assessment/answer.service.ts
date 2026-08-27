/**
 * Answer Service (spec §11-§12, §39).
 *
 * - UPSERT semantics backed by the DB UNIQUE(session_id, question_id).
 * - Answers are mutable ONLY while the session is `started`; after submit
 *   every mutation is rejected server-side.
 * - Every saved answer is stamped with the pinned question version so
 *   historical grading stays reproducible.
 * - The client never supplies scores/correctness — only its raw response.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'
import { asJson, type QuestionType } from '@/lib/assessment/types'
import { loadPinnedSelection } from '@/services/assessment/question-selection.service'

type Db = SupabaseClient<Database>

export interface SaveAnswerInput {
  sessionId: string
  appUserId: string
  questionId: number
  answerData: unknown
  timeSpentSeconds: number | null
}

const MAX_TIME_SPENT_SECONDS = 24 * 60 * 60

/** Normalized per-type answer payload stored in answers.answer_data. */
export function normalizeAnswerPayload(
  type: QuestionType,
  raw: unknown,
): Record<string, unknown> {
  const data = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>

  switch (type) {
    case 'multiple_choice': {
      const selected = data.selected_option_id ?? data.option_id
      if (typeof selected !== 'string' || !/^[A-Za-z0-9]{1,3}$/.test(selected)) {
        throw new AssessmentError('INVALID_ANSWER', 'گزینه انتخابی معتبر نیست.')
      }
      return { selected_option_id: selected.toUpperCase() }
    }
    case 'fill_blank': {
      if (typeof data.value !== 'string' && typeof data.text !== 'string') {
        throw new AssessmentError('INVALID_ANSWER', 'پاسخ جای خالی باید متن باشد.')
      }
      return { value: String(data.value ?? data.text).slice(0, 500) }
    }
    case 'open_ended': {
      if (typeof data.value !== 'string' && typeof data.text !== 'string') {
        throw new AssessmentError('INVALID_ANSWER', 'پاسخ تشریحی باید متن باشد.')
      }
      return { value: String(data.value ?? data.text).slice(0, 10_000) }
    }
    default: {
      // coding / debugging: the code itself lives in code_submissions;
      // the answer references the latest submission id + language.
      const submissionId = typeof data.submission_id === 'string' ? data.submission_id : null
      const language = typeof data.language === 'string' ? data.language.slice(0, 40) : null
      return {
        submission_id: submissionId,
        language,
        value: typeof data.code === 'string' ? data.code.slice(0, 50_000) : undefined,
      }
    }
  }
}

/**
 * Saves (or overwrites) the user's answer for one session question.
 * Throws unless the owning session is still `started`.
 */
export async function saveAnswer(db: Db, input: SaveAnswerInput): Promise<void> {
  const { sessionId, appUserId, questionId, answerData, timeSpentSeconds } = input

  // 1) Ownership + state gate in one indexed round-trip.
  const { data: sessionRow, error: sessionError } = await db
    .from('exam_sessions')
    .select('id, user_id, status')
    .eq('id', sessionId)
    .maybeSingle()
  if (sessionError) throw new AssessmentError('INTERNAL_ERROR', `answer/session: ${sessionError.message}`)
  if (!sessionRow) throw new AssessmentError('SESSION_NOT_FOUND')
  if (sessionRow.user_id !== appUserId) throw new AssessmentError('AUTHORIZATION_ERROR')
  if (sessionRow.status !== 'started') {
    throw new AssessmentError(
      'SESSION_ALREADY_SUBMITTED',
      'پاسخ‌ها پس از ثبت نهایی قابل تغییر نیستند.',
    )
  }

  // 2) The question must belong to this session's persisted selection.
  const pinned = await loadPinnedSelection(db, sessionId)
  const pin = pinned.find((p) => p.questionId === questionId)
  if (!pin) throw new AssessmentError('QUESTION_NOT_IN_SESSION')

  // 3) Load the real question type — never trust a client-declared type.
  const { data: qRow } = await db
    .from('questions')
    .select('type')
    .eq('id', questionId)
    .maybeSingle()
  if (!qRow) throw new AssessmentError('QUESTION_NOT_IN_SESSION')

  // 4) Normalize + persist as idempotent upsert.
  const normalized = normalizeAnswerPayload(qRow.type, answerData)
  const clampedTime =
    typeof timeSpentSeconds === 'number' && Number.isFinite(timeSpentSeconds)
      ? Math.min(Math.max(0, Math.round(timeSpentSeconds)), MAX_TIME_SPENT_SECONDS)
      : null

  const { error: upsertError } = await db.from('answers').upsert(
    {
      session_id: sessionId,
      question_id: questionId,
      answer_data: asJson(normalized),
      question_version_id: pin.versionId,
      ...(clampedTime !== null ? { time_spent_seconds: clampedTime } : {}),
    },
    { onConflict: 'session_id,question_id' },
  )
  if (upsertError) throw new AssessmentError('INTERNAL_ERROR', `answer upsert: ${upsertError.message}`)
}

/** Loads an existing answer row for a session/question (or null). */
export async function getAnswer(
  db: Db,
  sessionId: string,
  questionId: number,
): Promise<Database['public']['Tables']['answers']['Row'] | null> {
  const { data } = await db
    .from('answers')
    .select('*')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .maybeSingle()
  return (data as Database['public']['Tables']['answers']['Row']) ?? null
}
