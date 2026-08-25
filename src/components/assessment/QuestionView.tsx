'use client'

/**
 * Question renderer — pure UX. It never grades locally and never receives
 * correct answers; every save/execute call hits the server API.
 */

import { CodeEditor } from '@/components/assessment/CodeEditor'
import type { ClientQuestion, ClientAnswerEcho } from '@/lib/assessment/types'

export type AnswerDraft = Record<string, unknown>

interface QuestionViewProps {
  question: ClientQuestion
  saved: ClientAnswerEcho | null
  draft: AnswerDraft
  onDraftChange: (next: AnswerDraft) => void
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'چهارگزینه‌ای',
  fill_blank: 'جای خالی',
  open_ended: 'تشریحی',
  coding: 'برنامه‌نویسی',
  debugging: 'دیباگ',
}

export function QuestionHeader({ question }: { question: ClientQuestion }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-400">
        سؤال {question.order}
      </span>
      <span className="rounded-full border border-signal-500/25 bg-signal-500/10 px-2.5 py-0.5 text-[11px] text-signal-300">
        {TYPE_LABELS[question.type] ?? question.type}
      </span>
      {question.difficulty != null && (
        <span className="font-mono text-[11px] text-zinc-600" dir="ltr">
          {'★'.repeat(question.difficulty)}
        </span>
      )}
    </div>
  )
}

function bodyWithBlank(body: string): React.ReactNode {
  const parts = body.split('___')
  if (parts.length === 1) return body
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="mx-1 inline-block min-w-24 rounded border-b-2 border-signal-500/60 align-middle" />
      )}
    </span>
  ))
}

export function QuestionView({ question, draft, onDraftChange }: QuestionViewProps) {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <McqView question={question} draft={draft} onDraftChange={onDraftChange} />
      )
    case 'fill_blank':
      return <FillBlankView draft={draft} onDraftChange={onDraftChange} body={question.body} />
    case 'open_ended':
      return <OpenEndedView draft={draft} onDraftChange={onDraftChange} />
    case 'coding':
    case 'debugging':
      return <CodeView question={question} draft={draft} onDraftChange={onDraftChange} />
    default:
      return <p className="text-sm text-zinc-500">نوع سؤال پشتیبانی نمی‌شود.</p>
  }
}

// ---------------------------------------------------------------------------

function McqView({
  question,
  draft,
  onDraftChange,
}: Omit<QuestionViewProps, 'saved'>) {
  const selected = typeof draft.selected_option_id === 'string' ? draft.selected_option_id : ''
  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-8 text-zinc-100">{question.body}</p>
      <div className="grid gap-2.5">
        {(question.options ?? []).map((opt) => {
          const active = selected === opt.id.toUpperCase()
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onDraftChange({ ...draft, selected_option_id: opt.id.toUpperCase() })}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition-colors ${
                active
                  ? 'border-signal-500/60 bg-signal-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/25'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs ${
                  active ? 'border-signal-500 bg-signal-500 font-bold text-zinc-950' : 'border-white/15 text-zinc-400'
                }`}
              >
                {opt.id}
              </span>
              <span className="text-sm leading-6 text-zinc-200">{opt.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FillBlankView({
  body,
  draft,
  onDraftChange,
}: {
  body: string
  draft: AnswerDraft
  onDraftChange: (next: AnswerDraft) => void
}) {
  const value = typeof draft.value === 'string' ? draft.value : ''
  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-8 text-zinc-100">{bodyWithBlank(body)}</p>
      <input
        value={value}
        onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
        placeholder="پاسخ را اینجا بنویس…"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
      />
    </div>
  )
}

function OpenEndedView({
  draft,
  onDraftChange,
}: {
  draft: AnswerDraft
  onDraftChange: (next: AnswerDraft) => void
}) {
  const value = typeof draft.value === 'string' ? draft.value : ''
  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
        rows={8}
        placeholder="پاسخ کامل خود را بنویس…"
        className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-zinc-100 outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
      />
      <p className="text-[11px] text-zinc-600">این پاسخ به‌صورت تشریحی بررسی می‌شود و در نمره خودکار لحاظ نمی‌گردد.</p>
    </div>
  )
}

function CodeView({
  question,
  draft,
  onDraftChange,
}: {
  question: ClientQuestion
  draft: AnswerDraft
  onDraftChange: (next: AnswerDraft) => void
}) {
  const code =
    typeof draft.code === 'string' && draft.code.length > 0
      ? draft.code
      : (question.starterCode ?? (question.buggyCode ?? ''))

  function update(next: string) {
    onDraftChange({ ...draft, code: next })
  }

  return (
    <div className="space-y-5">
      <p className="whitespace-pre-wrap text-[15px] leading-8 text-zinc-100">{question.body}</p>

      {question.constraints.length > 0 && (
        <ul className="list-inside list-disc space-y-1 text-xs leading-6 text-zinc-500">
          {question.constraints.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}

      {question.examples.length > 0 && (
        <div className="space-y-2">
          {question.examples.map((ex, i) => (
            <div key={i} className="rounded-lg border border-white/[0.07] bg-black/30 p-3 font-mono text-xs" dir="ltr">
              <p className="text-zinc-500">in → {ex.input || '(empty)'}</p>
              <p className="mt-1 text-signal-300">out → {ex.output}</p>
            </div>
          ))}
        </div>
      )}

      {'buggyCode' in question && typeof question.buggyCode === 'string' && question.buggyCode && (
        <div className="rounded-xl border border-flag-500/25 bg-flag-500/[0.06] p-4" dir="ltr">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-flag-300">buggy code</p>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-zinc-200">
            {question.buggyCode}
          </pre>
        </div>
      )}

      <CodeEditor value={code} onChange={update} language={question.language} />
    </div>
  )
}
