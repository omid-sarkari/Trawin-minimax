'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Btn, Card, EmptyState, Field, fetchJson, inputClass } from '@/components/admin/ui'

interface Exam {
  id: number
  title: string
  slug: string
  status: string | null
  duration_minutes: number | null
  tracks: { id: number; name: string } | null
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشرشده',
  archived: 'بایگانی',
  closed: 'بسته',
}
const STATUS_TONES: Record<string, 'signal' | 'flag' | 'zinc'> = {
  published: 'signal',
  draft: 'flag',
}

const MODE_LABELS: Record<string, string> = { fixed: 'ثابت', adaptive: 'تطبیقی' }
const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'چهارگزینه‌ای',
  fill_blank: 'جای خالی',
  open_ended: 'تشریحی',
  coding: 'کدنویسی',
  debugging: 'دیباگ',
}

interface ExamQuestionRow {
  id: number
  question_id: number
  question_order: number
  weight: number | null
  questions: {
    id: number
    slug: string
    type: string
    status: string | null
    difficulty: number | null
    question_versions: Array<{ title: string; version: number }> | null
  } | null
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [tracks, setTracks] = useState<Array<{ id: number; name: string }>>([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [duration, setDuration] = useState('45')
  const [trackId, setTrackId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openExamId, setOpenExamId] = useState<number | null>(null)

  const load = useCallback(() => {
    fetchJson<{ exams: Exam[]; tracks: Array<{ id: number; name: string }> }>('/api/admin/exams')
      .then((d) => {
        setExams(d.exams)
        setTracks(d.tracks)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create() {
    setError(null)
    setBusy(true)
    try {
      await fetchJson('/api/admin/exams', {
        method: 'POST',
        body: JSON.stringify({
          title,
          slug,
          duration_minutes: Number(duration) || undefined,
          track_id: trackId || undefined,
        }),
      })
      setTitle(''); setSlug(''); setDuration('45'); setTrackId('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        {exams.length === 0 ? (
          <EmptyState title="هنوز آزمونی نساخته‌اید" desc="اولین آزمون را از فرم کنار بسازید." />
        ) : (
          <ul className="space-y-3">
            {exams.map((exam) => (
              <li key={exam.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{exam.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-600" dir="ltr">
                      {exam.slug} · {exam.duration_minutes ? `${exam.duration_minutes} min` : '—'} · {exam.tracks?.name ?? 'no track'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={STATUS_TONES[exam.status ?? 'draft'] ?? 'zinc'}>
                      {STATUS_LABELS[exam.status ?? 'draft'] ?? exam.status}
                    </Badge>
                    <Btn
                      variant="ghost"
                      className="h-8 px-3 text-xs"
                      onClick={() => setOpenExamId(openExamId === exam.id ? null : exam.id)}
                    >
                      {openExamId === exam.id ? 'بستن' : 'مدیریت'}
                    </Btn>
                  </div>
                </div>
                {openExamId === exam.id && (
                  <ExamQuestionManager examId={exam.id} examStatus={exam.status ?? 'draft'} onChanged={load} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card className="h-fit space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">آزمون جدید</h3>
        <Field label="عنوان"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="جونیر React Assessment" /></Field>
        <Field label="slug (اختیاری)"><input dir="ltr" className={`${inputClass} text-left font-mono`} value={slug} onChange={(e) => setSlug(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="مدت (دقیقه)"><input type="number" min={5} className={`${inputClass} font-mono`} dir="ltr" value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
          <Field label="Track">
            <select className={inputClass} value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              <option value="">—</option>
              {tracks.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </Field>
        </div>
        {error && <p className="text-xs leading-6 text-rose-300">{error}</p>}
        <Btn className="w-full" disabled={busy || title.trim().length < 3} onClick={create}>
          ایجاد آزمون
        </Btn>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-exam question manager (expandable panel)
// ---------------------------------------------------------------------------

function ExamQuestionManager({
  examId,
  examStatus,
  onChanged,
}: {
  examId: number
  examStatus: string
  onChanged: () => void
}) {
  const [rows, setRows] = useState<ExamQuestionRow[]>([])
  const [mode, setMode] = useState<'fixed' | 'adaptive'>('fixed')
  const [targetCount, setTargetCount] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Picker state
  const [search, setSearch] = useState('')
  const [pickerResults, setPickerResults] = useState<Array<{ id: number; slug: string; type: string }>>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)

  const loadPanel = useCallback(() => {
    setLoading(true)
    fetchJson<{
      questions: ExamQuestionRow[]
      config: { mode: string; target_question_count: number | null } | null
    }>(`/api/admin/exams/${examId}/questions`)
      .then((d) => {
        setRows(d.questions)
        if (d.config?.mode) setMode(d.config.mode === 'adaptive' ? 'adaptive' : 'fixed')
        setTargetCount(d.config?.target_question_count ? String(d.config.target_question_count) : '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'خطا'))
      .finally(() => setLoading(false))
  }, [examId])

  useEffect(() => {
    loadPanel()
  }, [loadPanel])

  async function searchQuestions() {
    if (search.trim().length < 2 && search.trim() !== '') return
    setSearching(true)
    try {
      const q = search.trim()
      const d = await fetchJson<{ items?: Array<{ id: number; slug: string; type: string }> }>(
        `/api/admin/questions?status=published&page=1${q ? `&q=${encodeURIComponent(q)}` : ''}`,
      )
      const attached = new Set(rows.map((r) => r.question_id))
      setPickerResults((d.items ?? []).filter((q2) => !attached.has(q2.id)).slice(0, 8))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در جستجو')
    } finally {
      setSearching(false)
    }
  }

  async function attach(questionId: number) {
    setAdding(true)
    setError(null)
    try {
      await fetchJson(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId }),
      })
      setPickerResults((prev) => prev.filter((p) => p.id !== questionId))
      loadPanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setAdding(false)
    }
  }

  async function detach(questionId: number) {
    setError(null)
    try {
      await fetchJson(`/api/admin/exams/${examId}/questions?question_id=${questionId}`, { method: 'DELETE' })
      loadPanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  async function patch(payload: Record<string, unknown>) {
    setError(null)
    try {
      await fetchJson(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  return (
    <div className="space-y-4 border-t border-white/[0.06] bg-black/20 px-5 py-5">
      {/* Attached questions */}
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-400">سؤالات آزمون ({rows.length})</p>
        {loading ? (
          <p className="py-4 text-center text-xs text-zinc-600">در حال بارگذاری…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 py-4 text-center text-xs text-zinc-600">
            هنوز سؤالی اضافه نشده است.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map((r) => {
              const latest = [...(r.questions?.question_versions ?? [])].sort((a, b) => b.version - a.version)[0]
              return (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-300">{latest?.title ?? r.questions?.slug ?? `#${r.question_id}`}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-600" dir="ltr">
                      #{r.question_order} · w:{r.weight ?? 1} · v{latest?.version ?? '?'} · {TYPE_LABELS[r.questions?.type ?? ''] ?? r.questions?.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => detach(r.question_id)}
                    className="shrink-0 rounded-md border border-rose-500/25 px-2 py-1 text-[10px] text-rose-300 transition-colors hover:bg-rose-500/10"
                  >
                    حذف
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add question */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-400">افزودن سؤال منتشرشده</p>
        <div className="flex gap-2">
          <input
            dir="ltr"
            className={`${inputClass} flex-1 text-left font-mono text-xs`}
            placeholder="جستجوی slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchQuestions()}
          />
          <Btn variant="soft" className="h-auto px-4 py-2 text-xs" disabled={searching} onClick={searchQuestions}>
            {searching ? '…' : 'جستجو'}
          </Btn>
        </div>
        {pickerResults.length > 0 && (
          <ul className="space-y-1.5">
            {pickerResults.map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded-lg border border-signal-500/20 bg-signal-500/[0.04] px-3 py-2">
                <span className="truncate font-mono text-[11px] text-zinc-300" dir="ltr">
                  #{q.id} {q.slug}
                </span>
                <button
                  type="button"
                  disabled={adding}
                  onClick={() => attach(q.id)}
                  className="shrink-0 rounded-md border border-signal-500/30 bg-signal-500/10 px-2 py-1 text-[10px] text-signal-300 hover:bg-signal-500/20 disabled:opacity-50"
                >
                  + افزودن
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selection mode */}
      <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-3">
        <Field label="حالت انتخاب">
          <select
            className={`${inputClass} h-auto py-2 text-xs`}
            value={mode}
            onChange={(e) => setMode(e.target.value === 'adaptive' ? 'adaptive' : 'fixed')}
          >
            <option value="fixed">ثابت</option>
            <option value="adaptive">تطبیقی</option>
          </select>
        </Field>
        <Field label="سقف تعداد سؤال">
          <input
            type="number"
            min={1}
            dir="ltr"
            placeholder="∞"
            className={`${inputClass} h-auto py-2 text-left font-mono text-xs`}
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
          />
        </Field>
        <Btn
          variant="ghost"
          className="h-auto py-2 text-xs"
          onClick={() =>
            patch({
              selection_mode: mode,
              target_question_count: Number(targetCount) > 0 ? Number(targetCount) : null,
            })
          }
        >
          ذخیره تنظیمات
        </Btn>
      </div>

      {/* Publish controls */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
        <Badge tone={STATUS_TONES[examStatus] ?? 'zinc'}>{STATUS_LABELS[examStatus] ?? examStatus}</Badge>
        <div className="flex gap-2">
          {examStatus !== 'published' && (
            <Btn variant="primary" className="h-8 px-4 text-xs" onClick={() => patch({ status: 'published' })}>
              انتشار آزمون
            </Btn>
          )}
          {examStatus === 'published' && (
            <Btn variant="danger" className="h-8 px-4 text-xs" onClick={() => patch({ status: 'closed' })}>
              بستن آزمون
            </Btn>
          )}
        </div>
      </div>

      {error && <p className="text-xs leading-6 text-rose-300">{error}</p>}
    </div>
  )
}
