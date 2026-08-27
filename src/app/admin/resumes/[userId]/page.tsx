'use client'

/**
 * Admin resume detail (§14): full admin view of one developer's living
 * resume + custom-section management + Pro grant/revoke.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Badge, Btn, fetchJson } from '@/components/admin/ui'
import type { DeveloperResume, ResumeSectionEntry } from '@/services/resume/living-resume.service'

const KIND_LABELS: Record<string, string> = {
  project: 'پروژه',
  experience: 'تجربه کاری',
  education: 'تحصیلات',
  achievement: 'دستاورد',
  competition: 'مسابقه',
  certification: 'گواهینامه',
  link: 'لینک',
  custom: 'سایر',
}

interface Detail {
  user: { id: string; username: string | null; role: string; status: string }
  plan: 'free' | 'pro'
  resume: DeveloperResume
}

export default function AdminResumeDetailPage() {
  const params = useParams<{ userId: string }>()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [newSection, setNewSection] = useState({ kind: 'achievement', title: '', subtitle: '' })

  const load = useCallback(() => {
    fetchJson<Detail>(`/api/admin/resumes/${params.userId}`)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'خطا'))
  }, [params.userId])

  useEffect(() => {
    load()
  }, [load])

  async function togglePlan() {
    if (!detail) return
    setBusy(true)
    try {
      await fetchJson(`/api/admin/users/${detail.user.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan: detail.plan === 'pro' ? 'free' : 'pro' }),
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  async function addSection() {
    if (!detail || newSection.title.trim().length < 2) return
    setBusy(true)
    try {
      await fetchJson(`/api/admin/resumes/${detail.user.id}/sections`, {
        method: 'POST',
        body: JSON.stringify(newSection),
      })
      setNewSection({ kind: newSection.kind, title: '', subtitle: '' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  async function patchSection(id: number, body: Record<string, unknown>) {
    setBusy(true)
    try {
      await fetchJson(`/api/admin/resumes/${detail?.user.id}/sections?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSection(id: number) {
    setBusy(true)
    try {
      await fetchJson(`/api/admin/resumes/${detail?.user.id}/sections?id=${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  if (error && !detail) {
    return (
      <div className="space-y-4">
        <Link href="/admin/resumes" className="text-xs text-signal-400">← بازگشت به جستجو</Link>
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-300">{error}</p>
      </div>
    )
  }

  if (!detail) {
    return <div className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
  }

  const r = detail.resume

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <Link href="/admin/resumes" className="inline-block text-xs text-signal-400 hover:text-signal-300">
        ← بازگشت به جستجوی رزومه‌ها
      </Link>

      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-50">{r.fullName ?? detail.user.username ?? '—'}</h2>
            {r.username && <span className="font-mono text-xs text-zinc-600" dir="ltr">@{r.username}</span>}
            <Badge tone={detail.user.role === 'admin' ? 'flag' : 'zinc'}>{detail.user.role}</Badge>
            <Badge tone={r.plan === 'pro' ? 'signal' : 'zinc'}>{r.plan.toUpperCase()}</Badge>
          </div>
          {r.headline && <p className="mt-1 text-xs text-zinc-500" dir="auto">{r.headline}</p>}
        </div>
        <Btn variant={r.plan === 'pro' ? 'danger' : 'soft'} disabled={busy} onClick={togglePlan}>
          {r.plan === 'pro' ? 'لغو Pro' : 'اعطای Pro'}
        </Btn>
      </section>

      {/* Evidence summary */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="font-mono text-xl font-bold text-zinc-100" dir="ltr">{r.stats.totalAssessments}</p>
          <p className="text-[10px] text-zinc-500">آزمون</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="font-mono text-xl font-bold text-zinc-100" dir="ltr">{r.stats.averageScore}</p>
          <p className="text-[10px] text-zinc-500">میانگین</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="font-mono text-xl font-bold text-signal-400" dir="ltr">{r.verifiedSkills.length}</p>
          <p className="text-[10px] text-zinc-500">مهارت تأییدشده</p>
        </div>
      </section>

      {/* Verified skills */}
      {r.verifiedSkills.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">مهارت‌های تأییدشده</h3>
          <ul className="space-y-2">
            {r.verifiedSkills.map((s) => (
              <li key={s.skillId} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-4 py-2.5">
                <span className="text-sm text-zinc-200">{s.name}</span>
                <span className="font-mono text-sm font-bold text-signal-400" dir="ltr">{s.score}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sections management */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">
          بخش‌های رزومه ({r.sections.length}) — افزودن ادمینی در رزومه نمایش داده می‌شود
        </h3>

        <ul className="mb-4 space-y-2">
          {r.sections.map((s: ResumeSectionEntry) => {
            const expanded = expandedId === s.id
            const description = typeof s.content?.description === 'string' ? s.content.description : ''
            const url = typeof s.content?.url === 'string' ? s.content.url : ''
            return (
              <li key={s.id} className={`rounded-lg border ${s.isVisible ? 'border-white/[0.07]' : 'border-white/[0.04] opacity-55'}`}>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : s.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-right"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-zinc-500">
                        {KIND_LABELS[s.kind] ?? s.kind}
                      </span>
                      <span className="truncate text-sm text-zinc-200">{s.title}</span>
                      <span className={`rounded-full px-1.5 text-[9px] ${s.managedBy === 'admin' ? 'border border-flag-500/30 text-flag-300' : 'text-zinc-600'}`}>
                        {s.managedBy === 'admin' ? 'ادمین' : 'کاربر'}
                      </span>
                      {!s.isVisible && <span className="rounded-full bg-white/[0.06] px-1.5 text-[9px] text-zinc-500">مخفی</span>}
                    </div>
                    {s.subtitle && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{s.subtitle}</p>}
                  </div>
                  <span className={`shrink-0 text-[10px] text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {expanded && (
                  <div className="space-y-2 border-t border-white/[0.06] px-4 py-3">
                    {description && <p className="whitespace-pre-wrap text-xs leading-6 text-zinc-400">{description}</p>}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="inline-block max-w-full truncate rounded-md border border-signal-500/25 bg-signal-500/[0.06] px-2 py-1 font-mono text-[11px] text-signal-300 hover:bg-signal-500/10"
                      >
                        {url}
                      </a>
                    )}
                    {!description && !url && <p className="text-[11px] text-zinc-600">محتوای تکمیلی ثبت نشده است.</p>}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchSection(s.id, { is_visible: !s.isVisible })}
                        className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-zinc-400 hover:border-signal-500/40 disabled:opacity-50"
                      >
                        {s.isVisible ? 'نمایش ✓' : 'مخفی ✗'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteSection(s.id)}
                        className="rounded-md border border-rose-500/25 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="grid grid-cols-[130px_1fr_1fr_auto] items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <select
            value={newSection.kind}
            onChange={(e) => setNewSection({ ...newSection, kind: e.target.value })}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-signal-500"
          >
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <input
            value={newSection.title}
            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
            placeholder="عنوان بخش…"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-signal-500"
          />
          <input
            value={newSection.subtitle}
            onChange={(e) => setNewSection({ ...newSection, subtitle: e.target.value })}
            placeholder="زیرعنوان (اختیاری)"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-signal-500"
          />
          <Btn variant="soft" className="h-auto px-4 py-2 text-xs" disabled={busy || newSection.title.trim().length < 2} onClick={addSection}>
            + افزودن
          </Btn>
        </div>
      </section>
    </div>
  )
}
