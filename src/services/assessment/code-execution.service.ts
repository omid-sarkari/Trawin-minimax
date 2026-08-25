/**
 * Code Execution Service (spec §23-§28).
 *
 * Pipeline: validated request → code_submissions(pending) → Judge0 runs
 * (hidden tests stay server-side) → execution_results → refreshed coding
 * answer_evaluation → sanitized public feedback.
 *
 * Strict scope: ONLY `coding` / `debugging` questions reach this service.
 * Multiple-choice, fill-blank and open-ended never touch the provider.
 * Provider outages NEVER mark a user's code wrong (spec §24).
 */

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'
import {
  judge0Provider,
  judge0ProviderConfigured,
} from '@/lib/services/judge0'
import { loadPinnedSelection } from '@/services/assessment/question-selection.service'
import { saveAnswer } from '@/services/assessment/answer.service'

type Db = SupabaseClient<Database>

interface StoredTestCase {
  name?: unknown
  input?: unknown
  expected_output?: unknown
  hidden?: unknown
}

export interface CodeSubmissionResult {
  /** Public, sanitized view — safe to return to the browser. */
  public: {
    status: 'success' | 'failed' | 'provider_error'
    verdict: string | null
    compileOutput: string
    tests: Array<{
      name: string
      passed: boolean
      input: string
      expectedOutput: string | null
      actualOutput: string | null
      stderr: string
    }>
    providerMessage?: string
  }
  submissionId: string
}

const MAX_CODE_LENGTH = 50_000
const MAX_RUNS_PER_WINDOW = 20
const WINDOW_MS = 60_000

function asStoredTestCases(value: unknown): StoredTestCase[] {
  return Array.isArray(value) ? (value as StoredTestCase[]) : []
}

export async function submitCode(
  db: Db,
  ids: { appUserId: string },
  sessionId: string,
  questionId: number,
  payload: { source_code?: unknown; language?: unknown },
): Promise<CodeSubmissionResult> {
  // ---- Validation (server-authoritative, spec §39) -----------------------
  const sourceCode =
    typeof payload.source_code === 'string' && payload.source_code.trim().length > 0
      ? payload.source_code.slice(0, MAX_CODE_LENGTH)
      : (() => { throw new AssessmentError('INVALID_ANSWER', 'کد ارسالی خالی است.') })()

  const { data: sessionRow } = await db
    .from('exam_sessions')
    .select('id, user_id, status')
    .eq('id', sessionId)
    .maybeSingle()
  if (!sessionRow) throw new AssessmentError('SESSION_NOT_FOUND')
  if (sessionRow.user_id !== ids.appUserId) throw new AssessmentError('AUTHORIZATION_ERROR')
  if (sessionRow.status !== 'started') throw new AssessmentError('SESSION_ALREADY_SUBMITTED')

  const pinned = await loadPinnedSelection(db, sessionId)
  const pin = pinned.find((p) => p.questionId === questionId)
  if (!pin) throw new AssessmentError('QUESTION_NOT_IN_SESSION')

  const { data: question } = await db
    .from('questions')
    .select('id, type')
    .eq('id', questionId)
    .maybeSingle()
  if (!question || !['coding', 'debugging'].includes(question.type)) {
    // Strict Judge0 scope: non-code questions must never be executed.
    throw new AssessmentError('EXECUTION_ERROR', 'این نوع سؤال اجرای کد ندارد.')
  }

  const language =
    typeof payload.language === 'string' && payload.language.trim()
      ? payload.language.trim().toLowerCase().slice(0, 40)
      : 'javascript'

  // ---- Lightweight abuse guard ------------------------------------------
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count } = await db
    .from('code_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ids.appUserId)
    .gte('created_at', since)
  if ((count ?? 0) >= MAX_RUNS_PER_WINDOW) {
    throw new AssessmentError('JUDGE0_RATE_LIMITED')
  }

  // ---- Pinned version → server-side tests -------------------------------
  const { data: version } = await db
    .from('question_versions')
    .select('test_cases, content, language')
    .eq('id', pin.versionId)
    .maybeSingle()
  if (!version) throw new AssessmentError('QUESTION_NOT_IN_SESSION')

  const storedTests = asStoredTestCases(version.test_cases)
  const effectiveLanguage =
    typeof version.language === 'string' && version.language ? version.language : language

  // ---- Submission record -------------------------------------------------
  const { data: submission, error: createError } = await db
    .from('code_submissions')
    .insert({
      user_id: ids.appUserId,
      question_id: questionId,
      language: effectiveLanguage,
      source_code: sourceCode,
      source_code_hash: createHash('sha256').update(sourceCode).digest('hex'),
      status: 'pending',
    })
    .select('id')
    .single()
  if (createError || !submission) {
    throw new AssessmentError('INTERNAL_ERROR', `submission create: ${createError?.message}`)
  }
  const submissionId = submission.id as string

  await db.from('code_submissions').update({ status: 'queued' }).eq('id', submissionId)

  // ---- Fail-closed configuration check (spec §55) ------------------------
  if (!judge0ProviderConfigured()) {
    await db.from('code_submissions').update({ status: 'error' }).eq('id', submissionId)
    throw new AssessmentError(
      'JUDGE0_UNAVAILABLE',
      'سرویس اجرای کد پیکربندی نشده است؛ نمره شما منفی نمی‌شود.',
    )
  }

  // ---- Execute ------------------------------------------------------------
  const runs =
    storedTests.length > 0
      ? storedTests.map((tc, i) => ({
          name: typeof tc.name === 'string' ? tc.name : `case-${i + 1}`,
          input: String(tc.input ?? ''),
          expectedOutput: tc.expected_output == null ? null : String(tc.expected_output),
          hidden: tc.hidden !== false,
        }))
      : [
          {
            name: 'smoke-run',
            input: '',
            expectedOutput: null,
            hidden: false,
          },
        ]

  interface ExecutedRun {
    run: TestRun
    passed: boolean
    stdout: string
    stderr: string
  }
  const executed: ExecutedRun[] = []
  let userVerdict: string | null = null
  let compileOutput = ''
  let providerFailure: string | null = null

  await db.from('code_submissions').update({ status: 'running' }).eq('id', submissionId)

  for (const run of runs) {
    const result = await judge0Provider.runOnce({
      sourceCode,
      language: effectiveLanguage,
      stdin: run.input,
    })

    switch (result.outcome.kind) {
      case 'provider': {
        providerFailure = result.outcome.reason
        break
      }
      case 'user': {
        let passed = result.outcome.verdict === 'accepted'
        if (passed && run.expectedOutput != null) {
          // Accepted exit does not imply correct output — compare here.
          passed = normalizeOut(result.stdout) === normalizeOut(run.expectedOutput)
        }
        executed.push({
          run,
          passed,
          stdout: truncate(result.stdout, 10_000),
          stderr: truncate(result.stderr ?? result.compileOutput, 2_000),
        })
        if (!passed && userVerdict === null) {
          userVerdict =
            result.outcome.verdict !== 'accepted' ? result.outcome.verdict : 'wrong_answer'
        }
        if (result.compileOutput) compileOutput = result.compileOutput
        break
      }
    }

    await db.from('execution_results').insert({
      submission_id: submissionId,
      output: truncate(result.stdout, 10_000),
      error_output: truncate(result.stderr ?? result.compileOutput, 10_000),
      execution_status:
        result.outcome.kind === 'user'
          ? result.outcome.verdict
          : `provider:${result.outcome.reason}`,
      execution_time: result.timeMs,
      memory_used: result.memoryKb,
    })

    if (providerFailure) break // infrastructure down → stop burning quota
  }

  await persistJudgeToken(db, submissionId)

  // ---- Classify outcome (spec §24) --------------------------------------
  if (providerFailure) {
    await db.from('code_submissions').update({ status: 'error' }).eq('id', submissionId)
    const message =
      providerFailure === 'invalid_language'
        ? 'این زبان در سرویس اجرا پشتیبانی نمی‌شود.'
        : providerFailure === 'rate_limited'
          ? 'سرویس اجرای کد شلوغ است؛ کمی بعد دوباره تلاش کنید.'
          : 'سرویس اجرای کد موقتاً در دسترس نیست؛ نمره شما منفی نمی‌شود.'
    const reasonMap: Record<string, AssessmentError['code']> = {
      invalid_language: 'JUDGE0_UNAVAILABLE',
      rate_limited: 'JUDGE0_RATE_LIMITED',
      timeout: 'JUDGE0_TIMEOUT',
      unavailable: 'JUDGE0_UNAVAILABLE',
      internal_error: 'JUDGE0_UNAVAILABLE',
    }
    throw new AssessmentError(reasonMap[providerFailure] ?? 'JUDGE0_UNAVAILABLE', message)
  }

  const finalStatus = userVerdict === null ? 'success' : 'failed'
  await db.from('code_submissions').update({ status: finalStatus }).eq('id', submissionId)

  // ---- Link answer + pre-evaluate so finalize never re-executes ----------
  await saveAnswer(db, {
    sessionId,
    appUserId: ids.appUserId,
    questionId,
    answerData: { submission_id: submissionId, language: effectiveLanguage, code: sourceCode },
    timeSpentSeconds: null,
  })
  await upsertCodingEvaluation(db, sessionId, questionId, question.type, userVerdict, executed.length)

  return {
    submissionId,
    public: {
      status: finalStatus === 'success' ? 'success' : 'failed',
      verdict: userVerdict,
      compileOutput: truncate(compileOutput, 4_000),
      // Hidden tests are reported WITHOUT inputs/expected outputs.
      tests: executed.map((e) => ({
        name: e.run.name,
        passed: e.passed,
        // Hidden payloads never leave the server.
        input: e.run.hidden ? '' : e.run.input,
        expectedOutput: e.run.hidden ? null : e.run.expectedOutput,
        actualOutput: e.run.hidden ? null : truncate(e.stdout, 4_000),
        stderr: e.run.hidden ? '' : e.stderr,
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestRun {
  name: string
  input: string
  expectedOutput: string | null
  hidden: boolean
}

function normalizeOut(value: string): string {
  return value.replace(/\r\n/g, '\n').trim()
}

function truncate(value: string | null | undefined, max: number): string {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/**
 * Stores the provider token server-side only when the raw response exposed
 * one. Kept separate so the happy path stays a single UPDATE.
 */
async function persistJudgeToken(db: Db, _submissionId: string): Promise<void> {
  // judge0_submission_id remains NULL: we do not retain provider tokens for
  // exam submissions (privacy + no cross-provider replay). Reserved hook for
  // future providers that require token bookkeeping.
  void db
  void _submissionId
}

/**
 * Writes (replaces) the coding/debugging answer_evaluation derived from
 * execution results. Called right after each successful run batch.
 */
async function upsertCodingEvaluation(
  db: Db,
  sessionId: string,
  questionId: number,
  evaluatorType: string,
  userVerdict: string | null,
  testCount: number,
): Promise<void> {
  const { data: answerRow } = await db
    .from('answers')
    .select('id')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .maybeSingle()
  if (!answerRow) return

  await db.from('answer_evaluations').delete().eq('answer_id', answerRow.id)
  await db.from('answer_evaluations').insert({
    answer_id: answerRow.id,
    evaluator_type: `${evaluatorType}_evaluator`,
    result: {
      outcome: userVerdict === null ? 'correct' : 'incorrect',
      verdict: userVerdict ?? 'accepted',
      test_count: testCount,
      graded_by: 'code_execution',
    },
  })
}
