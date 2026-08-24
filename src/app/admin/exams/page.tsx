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

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [tracks, setTracks] = useState<Array<{ id: number; name: string }>>([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [duration, setDuration] = useState('45')
  const [trackId, setTrackId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
              <li key={exam.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{exam.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-600" dir="ltr">
                    {exam.slug} · {exam.duration_minutes ? `${exam.duration_minutes} min` : '—'} · {exam.tracks?.name ?? 'no track'}
                  </p>
                </div>
                <Badge tone={STATUS_TONES[exam.status ?? 'draft'] ?? 'zinc'}>
                  {STATUS_LABELS[exam.status ?? 'draft'] ?? exam.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-xs leading-6 text-zinc-600">
          افزودن سؤال به آزمون با ترتیب و وزن، در مرحله بعدی توسعه اضافه می‌شود.
        </p>
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
