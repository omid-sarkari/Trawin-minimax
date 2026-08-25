'use client'

/**
 * Exam Runner — client UX over the server-authoritative runtime.
 *
 * - Session recovery: every mount calls /start which resumes an active
 *   session (refresh-safe, multi-tab-safe).
 * - Timer is a DISPLAY of the server's remainingSeconds; each server
 *   response re-syncs it. At zero the runner auto-submits.
 * - Autosave debounces PUT /answers; coding runs POST …/code explicitly.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  QuestionView,
  QuestionHeader,
  type AnswerDraft,
} from '@/components/assessment/QuestionView'
import type { ClientQuestion, ClientResult, ClientSessionState } from '@/lib/assessment/types'

type RunFeedback = {
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

const VERDICT_LABELS: Record<string, string> = {
  accepted: 'پذیرفته شد',
  wrong_answer: 'خروجی نادرست',
  compile_error: 'خطای کامپایل',
  runtime_error: 'خطای اجرا',
  time_limit_exceeded: 'اتمام زمان اجرا',
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error((data as { error?: string }).error ?? 'خطا'), {
    code: (data as { code?: string }).code,
  })
  return data as T
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ExamRunner({ examId }: { examId: string }) {
  const [session, setSession] = useState<ClientSessionState | null>(null)
  const [result, setResult] = useState<ClientResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState<string | null>(null)

  const [current, setCurrent] = useState(0)
  const [drafts, setDrafts] = useState<Record<number, AnswerDraft>>({})
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [runningCode, setRunningCode] = useState(false)
  const [runFeedback, setRunFeedback] = useState<RunFeedback | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const sessionRef = useRef<ClientSessionState | null>(null)
  sessionRef.current = session

  // ---- Boot ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    api<ClientSessionState>(`/api/assessment/exams/${examId}/start`, { method: 'POST' })
      .then((state) => {
        if (cancelled) return
        setSession(state)
        setRemaining(state.remainingSeconds)
        setCurrent(Math.min(state.currentIndex, Math.max(0, state.questions.length - 1)))
        const restored: Record<number, AnswerDraft> = {}
        for (const a of state.answers) restored[a.questionId] = a.answerData
        setDrafts(restored)
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          setFatalError(err instanceof Error ? err.message : 'خطای شروع آزمون')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [examId])

  // ---- Display-only countdown --------------------------------------------
  useEffect(() => {
    if (remaining === null || result) return
    if (remaining <= 0 && !submitting) {
      void doSubmit(true)
      return
    }
    const t = setTimeout(() => setRemaining((r) => (r !== null ? Math.max(0, r - 1) : null)), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, result])

  // ---- Autosave -------------------------------------------------------------
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueSave = useCallback(
    (questionId: number, draft: AnswerDraft, timeSpent: number | null) => {
      const sessionId = sessionRef.current?.sessionId
      if (!sessionId) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSavingState('saving')
      saveTimer.current = setTimeout(() => {
        api(`/api/assessment/sessions/${sessionId}/answers`, {
          method: 'PUT',
          body: JSON.stringify({
            question_id: questionId,
            answer_data: draft,
            time_spent_seconds: timeSpent,
          }),
        })
          .then(() => setSavingState('saved'))
          .catch(() => setSavingState('idle'))
      }, 700)
    },
    [],
  )

  function onDraftChange(question: ClientQuestion, next: AnswerDraft) {
    setDrafts((d) => ({ ...d, [question.id]: next }))
    queueSave(question.id, next, null)
  }

  async function runCode(question: ClientQuestion) {
    const s = sessionRef.current
    if (!s) return
    setRunningCode(true)
    setRunFeedback(null)
    try {
      await api(`/api/assessment/sessions/${s.sessionId}/answers`, {
        method: 'PUT',
        body: JSON.stringify({ question_id: question.id, answer_data: drafts[question.id] ?? {} }),
      })
      const feedback = await api<RunFeedback>(
        `/api/assessment/sessions/${s.sessionId}/questions/${question.id}/code`,
        {
          method: 'POST',
          body: JSON.stringify({
            source_code: drafts[question.id]?.code ?? '',
            language: question.language ?? 'javascript',
          }),
        },
      )
      setRunFeedback(feedback)
      if ('remainingSeconds' in (s as object)) {
        // Re-sync authoritative timer after a long-running operation.
        api<{ state?: ClientSessionState; result?: ClientResult }>(`/api/assessment/sessions/${s.sessionId}`)
          .then((payload) => {
            if (payload.state) setRemaining(payload.state.remainingSeconds)
            else if (payload.result) setResult(payload.result)
          })
          .catch(() => {})
      }
    } catch (err) {
      setRunFeedback({
        status: 'provider_error',
        verdict: null,
        compileOutput: '',
        tests: [],
        providerMessage: err instanceof Error ? err.message : 'خطا در اجرای کد',
      })
    } finally {
      setRunningCode(false)
    }
  }

  async function doSubmit(auto = false) {
    const s = sessionRef.current
    if (!s || submitting) return
    if (!auto && remaining !== null && remaining > 0) {
      const sure = window.confirm('از ثبت نهایی پاسخ‌ها مطمئنی؟ بعد از ثبت امکان ویرایش نیست.')
      if (!sure) return
    }
    setSubmitting(true)
    try {
      const r = await api<ClientResult>(`/api/assessment/sessions/${s.sessionId}/submit`, {
        method: 'POST',
      })
      setResult(r)
    } catch (err) {
      setFatalError(err instanceof Error ? err.message : 'خطا در ثبت نهایی')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- Render ---------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
      </div>
    )
  }

  if (fatalError && !result) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <p className="text-sm leading-7 text-rose-300">{fatalError}</p>
        <Link href="/dashboard/exams" className="mt-6 inline-block text-xs text-signal-400 hover:text-signal-300">
          ← بازگشت به لیست آزمون‌ها
        </Link>
      </div>
    )
  }

  if (result) return <ResultView result={result} />

  if (!session) return null

  const question = session.questions[current]
  const answeredCount = session.questions.filter((q) => {
    const d = drafts[q.id]
    if (!d) return false
    return Object.values(d).some((v) => typeof v === 'string' && v.length > 0) || 'selected_option_id' in d
  }).length
  const progress = session.questions.length > 0 ? (answeredCount / session.questions.length) * 100 : 0
  const lowTime = remaining !== null && remaining <= 120

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-white/[0.07] bg-zinc-950/90 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-zinc-100">{session.examTitle}</h1>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              سؤال {current + 1} از {session.questions.length}
              {' · '}
              {savingState === 'saving' ? 'در حال ذخیره…' : savingState === 'saved' ? 'ذخیره شد ✓' : ''}
            </p>
          </div>
          <span
            dir="ltr"
            className={`rounded-full border px-4 py-1.5 font-mono text-sm font-bold tabular-nums ${
              lowTime ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-white/15 bg-white/5 text-zinc-200'
            }`}
          >
            {remaining !== null ? formatClock(remaining) : '—'}
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-signal-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {question && (
        <div className="space-y-5">
          <QuestionHeader question={question} />
          <QuestionView
            key={question.id}
            question={question}
            saved={session.answers.find((a) => a.questionId === question.id) ?? null}
            draft={drafts[question.id] ?? {}}
            onDraftChange={(next) => onDraftChange(question, next)}
          />

          {(question.type === 'coding' || question.type === 'debugging') && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={runningCode}
                onClick={() => runCode(question)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-signal-500/30 bg-signal-500/10 px-5 text-sm font-medium text-signal-300 transition-colors hover:bg-signal-500/20 disabled:opacity-50"
              >
                {runningCode ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    در حال اجرا…
                  </>
                ) : (
                  '▶ اجرا و بررسی کد'
                )}
              </button>

              {runFeedback && <RunFeedbackPanel feedback={runFeedback} />}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
        <button
          type="button"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          className="rounded-full border border-white/15 px-5 py-2 text-sm text-zinc-300 transition-colors hover:border-white/35 disabled:opacity-40"
        >
          قبلی
        </button>

        {current < session.questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => c + 1)}
            className="rounded-full bg-signal-500 px-6 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400"
          >
            بعدی
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => doSubmit(false)}
            className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-7 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-signal-400 disabled:opacity-50"
          >
            {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            ثبت نهایی آزمون
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function RunFeedbackPanel({ feedback }: { feedback: RunFeedback }) {
  if (feedback.status === 'provider_error') {
    return (
      <div className="rounded-xl border border-flag-500/25 bg-flag-500/[0.06] p-4">
        <p className="text-xs leading-6 text-flag-300">{feedback.providerMessage}</p>
        <p className="mt-1 text-[11px] text-zinc-600">این خطا به پاسخ شما آسیب نمی‌زند؛ بعداً دوباره تلاش کن.</p>
      </div>
    )
  }

  const failedCompile = feedback.verdict === 'compile_error'
  return (
    <div className="space-y-2">
      <div
        className={`rounded-xl border p-4 ${
          feedback.status === 'success'
            ? 'border-signal-500/25 bg-signal-500/[0.06]'
            : 'border-rose-500/25 bg-rose-500/[0.06]'
        }`}
      >
        <p className={`text-xs font-semibold ${feedback.status === 'success' ? 'text-signal-300' : 'text-rose-300'}`}>
          {feedback.status === 'success' ? 'همه تست‌ها پاس شد ✓' : `نتیجه: ${VERDICT_LABELS[feedback.verdict ?? ''] ?? 'ناموفق'}`}
        </p>
      </div>

      {failedCompile && feedback.compileOutput && (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-black/40 p-4 font-mono text-xs leading-6 text-zinc-400" dir="ltr">
          {feedback.compileOutput}
        </pre>
      )}

      {!failedCompile && feedback.tests.length > 0 && (
        <ul className="space-y-1.5" dir="ltr">
          {feedback.tests.map((t, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs ${
                t.passed ? 'border-white/[0.06] bg-white/[0.02] text-zinc-400' : 'border-rose-500/20 bg-rose-500/[0.05] text-rose-300'
              }`}
            >
              <span>{t.passed ? '✓' : '✗'} {t.name}</span>
              {!t.passed && t.actualOutput != null && (
                <span className="text-zinc-600">got: {t.actualOutput.slice(0, 40) || '(empty)'}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ResultView({ result }: { result: ClientResult }) {
  const inReview = result.status === 'submitted' || result.status === 'evaluating'
  return (
    <div className="mx-auto max-w-lg pt-12">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
        {inReview ? (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-flag-500/30 bg-flag-500/10 text-2xl">⏳</span>
            <h1 className="mt-5 text-lg font-bold text-zinc-100">آزمون ثبت شد</h1>
            <p className="mt-2 text-xs leading-6 text-zinc-500">ارزیابی در جریان است؛ نتایج کمی بعد در داشبورد نمایش داده می‌شود.</p>
          </>
        ) : (
          <>
            <p className="font-mono text-6xl font-black text-signal-400" dir="ltr">
              {result.score ?? '—'}
            </p>
            {result.level && (
              <span className="mt-3 inline-block rounded-full border border-signal-500/25 bg-signal-500/10 px-3 py-1 text-xs text-signal-300" dir="ltr">
                {result.level}
              </span>
            )}
            <h1 className="mt-5 text-lg font-bold text-zinc-100">نتیجه آزمون</h1>
          </>
        )}

        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-10 items-center rounded-full bg-signal-500 px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400"
        >
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  )
}
