/**
 * LIVE acceptance test (spec §54) — runs ONLY when
 * SUPABASE_SERVICE_ROLE_KEY is present (CI skips automatically).
 *
 * Flow: publish exam → start session → answer (idempotent upsert) →
 * refresh recovery → submit → evaluation → result reproducibility.
 * All rows are cleaned up afterwards.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { startExam, getSessionState, submitExam } from '@/services/assessment/exam-session.service'
import { saveAnswer, getAnswer } from '@/services/assessment/answer.service'

const SVC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SVC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const mayRunLive = Boolean(SVC_URL && SVC_KEY)
const d = mayRunLive ? describe : describe.skip

function svc(): ReturnType<typeof makeSvc> {
  return makeSvc()
}
function makeSvc() {
  return createSupabaseClient<Database>(SVC_URL!, SVC_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const STAMP = Date.now().toString(36)
const TEST_EMAIL = `e2e-runtime-${STAMP}@trawin-local.test`
let examId = -1
let appUserId = ''
let authUserId = ''
const attachedQuestionIds: number[] = []
let expectedMcqCorrect = ''
let fillAccepted = ''

d('LIVE assessment runtime acceptance (§54)', () => {
  afterAll(async () => {
    // ---- Full cleanup (child rows cascade) --------------------------------
    const db = svc()
    if (!appUserId) return

    // selection events are SET NULL on session delete → remove explicitly.
    const { data: sessions } = await db
      .from('exam_sessions')
      .select('id')
      .eq('user_id', appUserId)
    for (const s of sessions ?? []) {
      await db.from('question_selection_events').delete().eq('session_id', s.id)
    }
    await db.from('users').delete().eq('id', appUserId)
    await db.from('exams').delete().eq('id', examId)

    if (authUserId) {
      await db.auth.admin.deleteUser(authUserId)
    }
  }, 30_000)

  test(
    'setup: pick questions, build + publish exam, create test user',
    async () => {
      const db = svc()

      const { data: mcq } = await db
        .from('questions')
        .select('id, status, question_versions(id, content)')
        .eq('type', 'multiple_choice')
        .eq('status', 'published')
        .limit(1)
        .maybeSingle()
      expect(mcq).toBeTruthy()
      attachedQuestionIds.push(mcq!.id)
      const mcqVersion = [...(mcq!.question_versions ?? [])].sort((a, b) => b.id - a.id)[0]
      const options = ((mcqVersion?.content as Record<string, unknown>)?.options ?? []) as Array<{ id: string; is_correct: boolean }>
      const correctOption = options.find((o) => o.is_correct)
      expect(correctOption).toBeTruthy()
      expectedMcqCorrect = String(correctOption!.id).toUpperCase()

      const { data: fb } = await db
        .from('questions')
        .select('id, status, question_versions(id, content)')
        .eq('type', 'fill_blank')
        .eq('status', 'published')
        .limit(1)
        .maybeSingle()
      expect(fb).toBeTruthy()
      attachedQuestionIds.push(fb!.id)
      const fbVersion = [...(fb!.question_versions ?? [])].sort((a, b) => b.id - a.id)[0]
      const accepted = ((fbVersion?.content as Record<string, unknown>)?.accepted_answers ?? []) as string[]
      expect(accepted.length).toBeGreaterThan(0)
      fillAccepted = String(accepted[0])

      const { data: exam, error } = await db
        .from('exams')
        .insert({
          title: `E2E Runtime ${STAMP}`,
          slug: `e2e-runtime-${STAMP}`,
          duration_minutes: 30,
          status: 'published',
        })
        .select('id')
        .single()
      expect(error).toBeNull()
      examId = exam!.id

      await db.from('exam_questions').insert([
        { exam_id: examId, question_id: attachedQuestionIds[0], question_order: 1 },
        { exam_id: examId, question_id: attachedQuestionIds[1], question_order: 2 },
      ])
      await db.from('exam_selection_configs').insert({
        exam_id: examId,
        mode: 'fixed',
        target_question_count: null,
        config: {},
        active: true,
      })

      const { data: created, error: createUserError } = await db.auth.admin.createUser({
        email: TEST_EMAIL,
        password: `pw-${STAMP}-Aa1!`,
        email_confirm: true,
      })
      expect(createUserError).toBeNull()
      authUserId = created!.user!.id

      // Trigger creates public.users row asynchronously-synchronously AFTER INSERT.
      let userId: string | null = null
      for (let i = 0; i < 10 && !userId; i++) {
        await new Promise((r) => setTimeout(r, 300))
        const { data: u } = await db
          .from('users')
          .select('id')
          .eq('auth_user_id', authUserId)
          .maybeSingle()
        userId = u?.id ?? null
      }
      expect(userId).toBeTruthy()
      appUserId = userId!
    },
    60_000,
  )

  test(
    'start creates a pinned session with exactly the fixed set',
    async () => {
      const db = svc()
      const state = await startExam(db, { appUserId, authUserId }, examId)
      expect(state.status).toBe('started')
      expect(state.questions.map((q) => q.id).sort()).toEqual([...attachedQuestionIds].sort())
      expect(state.remainingSeconds).toBeLessThanOrEqual(1800)

      const { count } = await db
        .from('question_selection_events')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', state.sessionId)
      expect(count).toBe(attachedQuestionIds.length)
    },
    60_000,
  )

  test(
    'start is idempotent (refresh-safe) and saves are idempotent UPSERTs',
    async () => {
      const db = svc()
      const again = await startExam(db, { appUserId, authUserId }, examId)
      const { count } = await db
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('exam_id', examId)
      expect(count).toBe(1)
      expect(again.questions.length).toBe(2)

      const mcqQuestion = again.questions.find((q) => q.type === 'multiple_choice')!
      await saveAnswer(db, {
        sessionId: again.sessionId,
        appUserId,
        questionId: mcqQuestion.id,
        answerData: { selected_option_id: 'ZZ' }, // invalid-but-normalizable → normalized shape only
        timeSpentSeconds: 12,
      })
      await saveAnswer(db, {
        sessionId: again.sessionId,
        appUserId: appUserId,
        questionId: mcqQuestion.id,
        answerData: { selected_option_id: expectedMcqCorrect },
        timeSpentSeconds: 25,
      })
      const saved = await getAnswer(db, again.sessionId, mcqQuestion.id)
      expect(saved).toBeTruthy()
      expect((saved!.answer_data as Record<string, unknown>).selected_option_id).toBe(expectedMcqCorrect)
      expect(saved!.question_version_id).toBeGreaterThan(0)
    },
    60_000,
  )

  test(
    'fill-blank answered correctly; refresh recovers state with echoes',
    async () => {
      const db = svc()
      const { state } = await getSessionState(db, { appUserId, authUserId }, (
        await db.from('exam_sessions').select('id').eq('exam_id', examId).maybeSingle()
      ).data!.id)
      expect(state).toBeTruthy()
      expect(state!.answers.length).toBeGreaterThanOrEqual(1)

      const fbQuestion = state!.questions.find((q) => q.type === 'fill_blank')!
      await saveAnswer(db, {
        sessionId: state!.sessionId,
        appUserId,
        questionId: fbQuestion.id,
        answerData: { value: fillAccepted.toUpperCase() }, // normalization must accept
        timeSpentSeconds: 8,
      })
    },
    60_000,
  )

  test(
    'submit finalizes: score 100, level mapped, evaluation persisted',
    async () => {
      const db = svc()
      const { data: sessionRow } = await db
        .from('exam_sessions')
        .select('id')
        .eq('exam_id', examId)
        .maybeSingle()
      const sessionId = sessionRow!.id

      const result = await submitExam(db, appUserId, sessionId)
      expect(result.status).toBe('completed')
      expect(result.score).toBe(100)
      expect(result.level).toBe('expert')

      // Idempotent double submit converges on the same result.
      const second = await submitExam(db, appUserId, sessionId)
      expect(second.score).toBe(100)

      const { data: evaluation } = await db
        .from('evaluations')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()
      expect(evaluation).toBeTruthy()
      expect(evaluation!.overall_score).toBe(100)
      expect(evaluation!.engine_version_id).not.toBeNull()

      // Historical reproducibility: answers carry their pinned versions.
      const { data: answers } = await db
        .from('answers')
        .select('question_id, question_version_id')
        .eq('session_id', sessionId)
      expect(answers!.every((a) => typeof a.question_version_id === 'number')).toBe(true)
    },
    60_000,
  )

  test(
    'post-completion state read returns the stored result',
    async () => {
      const db = svc()
      const { data: sessionRow } = await db
        .from('exam_sessions')
        .select('id')
        .eq('exam_id', examId)
        .maybeSingle()
      const { result } = await getSessionState(db, { appUserId, authUserId }, sessionRow!.id)
      expect(result?.status).toBe('completed')
      expect(result?.score).toBe(100)
    },
    60_000,
  )
})
