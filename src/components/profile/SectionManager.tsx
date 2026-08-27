'use client'

/**
 * Custom resume section manager — developer's own entries.
 * CRUD via /api/resume/sections; every change persists immediately and
 * re-renders the live resume above (p3.md addendum: DB-backed, toggleable).
 *
 * UX: form labels/placeholders adapt to the selected kind, and every saved
 * entry expands on click to show its full content.
 */

import { useMemo, useState } from 'react'
import type { ResumeSectionEntry } from '@/services/resume/living-resume.service'

const KIND_OPTIONS = [
  { key: 'project', label: 'پروژه' },
  { key: 'experience', label: 'تجربه کاری' },
  { key: 'education', label: 'تحصیلات' },
  { key: 'achievement', label: 'دستاورد' },
  { key: 'competition', label: 'مسابقه' },
  { key: 'certification', label: 'گواهینامه' },
  { key: 'link', label: 'لینک' },
] as const

/** Per-kind copy so switching the kind re-contextualizes the whole form. */
const KIND_COPY: Record<string, { title: string; subtitle: string; subtitleLabel: string; description: string; url: string; urlLabel: string }> = {
  project: {
    title: 'نام پروژه — مثلاً فروشگاه آنلاین Next.js',
    subtitle: 'مثلاً Next.js · تیم ۳ نفره · ۱۴۰۳',
    subtitleLabel: 'تکنولوژی‌ها و تیم (اختیاری)',
    description: 'چی ساختی؟ چه مشکلی را حل کرد؟ نقشت چه بود؟',
    url: 'https://demo یا ریپو … (اختیاری)',
    urlLabel: 'لینک دمو/ریپو',
  },
  experience: {
    title: 'عنوان شغل — مثلاً Frontend Developer در شرکت X',
    subtitle: 'مثلاً ۱۴۰۱ تا اکنون · تمام‌وقت',
    subtitleLabel: 'بازه زمانی و نوع همکاری',
    description: 'مسئولیت‌ها و دستاوردهای کلیدی تو چه بود؟',
    url: 'https://وبسایت شرکت … (اختیاری)',
    urlLabel: 'لینک شرکت',
  },
  education: {
    title: 'رشته و موسسه — مثلاً مهندسی نرم‌افزار، دانشگاه تهران',
    subtitle: 'مثلاً کارشناسی · ۱۳۹۷ تا ۱۴۰۱',
    subtitleLabel: 'مقطع و بازه زمانی',
    description: 'پروژه پایانی، رتبه یا نکته برجسته (اختیاری)',
    url: '',
    urlLabel: '',
  },
  achievement: {
    title: 'شرح دستاورد — مثلاً رتبه برتر هکاتون ملی',
    subtitle: 'مثلاً ۱۴۰۳ · بین ۲۰۰ تیم',
    subtitleLabel: 'تاریخ و مقیاس',
    description: 'چه کردی که به این دستاورد رسیدی؟',
    url: 'https://منبع دستاورد … (اختیاری)',
    urlLabel: 'لینک مرجع',
  },
  competition: {
    title: 'نام مسابقه — مثلاً CodeCup فصل ۴',
    subtitle: 'مثلاً رتبه ۳ از ۱۵۰ شرکت‌کننده',
    subtitleLabel: 'رتبه و تاریخ',
    description: 'فرمت مسابقه و عملکردت را توضیح بده.',
    url: 'https://صفحه نتایج … (اختیاری)',
    urlLabel: 'لینک نتایج',
  },
  certification: {
    title: 'نام گواهینامه — مثلاً AWS Cloud Practitioner',
    subtitle: 'مثلاً صادرکننده: Amazon · ۱۴۰۳',
    subtitleLabel: 'صادرکننده و تاریخ اخذ',
    description: 'حوزه پوشش داده‌شده توسط گواهینامه.',
    url: 'https://لینک تأیید گواهینامه … (اختیاری)',
    urlLabel: 'لینک تأیید',
  },
  link: {
    title: 'عنوان لینک — مثلاً گیت‌هاب من',
    subtitle: '',
    subtitleLabel: 'زیرعنوان (اختیاری)',
    description: 'این لینک چی را نشان می‌دهد؟',
    url: 'https://…',
    urlLabel: 'آدرس لینک',
  },
}

interface Draft {
  kind: string
  title: string
  subtitle: string
  description: string
  url: string
}

const emptyDraft: Draft = { kind: 'project', title: '', subtitle: '', description: '', url: '' }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'خطا')
  return data as T
}

export function SectionManager({
  sections,
  onChange,
}: {
  sections: ResumeSectionEntry[]
  onChange: (next: ResumeSectionEntry[]) => void
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const copy = KIND_COPY[draft.kind] ?? KIND_COPY.project

  const grouped = useMemo(() => {
    const map = new Map<string, ResumeSectionEntry[]>()
    for (const s of sections) map.set(s.kind, [...(map.get(s.kind) ?? []), s])
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [sections])

  async function add() {
    setError(null)
    if (draft.title.trim().length < 2) {
      setError('عنوان بخش را وارد کن.')
      return
    }
    setBusy(true)
    try {
      const content: Record<string, unknown> = {}
      if (draft.description.trim()) content.description = draft.description.trim()
      if (draft.url.trim()) content.url = draft.url.trim()
      await api('/api/resume/sections', {
        method: 'POST',
        body: JSON.stringify({ kind: draft.kind, title: draft.title, subtitle: draft.subtitle || null, content }),
      })
      onChange([
        ...sections,
        {
          id: Date.now(), // optimistic id; page refresh reconciles with DB ids
          kind: draft.kind,
          title: draft.title.trim(),
          subtitle: draft.subtitle || null,
          content,
          isVisible: true,
          displayOrder: sections.length,
          managedBy: 'developer',
        },
      ])
      setDraft(emptyDraft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  async function toggleVisible(entry: ResumeSectionEntry) {
    setBusy(true)
    try {
      await api(`/api/resume/sections?id=${entry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_visible: !entry.isVisible }),
      })
      onChange(sections.map((s) => (s.id === entry.id ? { ...s, isVisible: !s.isVisible } : s)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  async function remove(entry: ResumeSectionEntry) {
    setBusy(true)
    try {
      await api(`/api/resume/sections?id=${entry.id}`, { method: 'DELETE' })
      onChange(sections.filter((s) => s.id !== entry.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">بخش‌های من (پروژه، تجربه، تحصیلات و…)</h3>

      {/* List — click a row to expand full content */}
      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-zinc-600">
          هنوز بخشی اضافه نکرده‌ای. اولین پروژه یا تجربه‌ات را اضافه کن.
        </p>
      ) : (
        <ul className="mb-5 space-y-2">
          {grouped.map(([kind, items]) => (
            <li key={kind}>
              <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {KIND_OPTIONS.find((k) => k.key === kind)?.label ?? kind} ({items.length})
              </p>
              <ul className="space-y-1.5">
                {items.map((s) => {
                  const expanded = expandedId === s.id
                  const description = typeof s.content?.description === 'string' ? s.content.description : ''
                  const url = typeof s.content?.url === 'string' ? s.content.url : ''
                  return (
                    <li
                      key={s.id}
                      className={`rounded-xl border transition-opacity ${
                        s.isVisible ? 'border-white/[0.07] bg-black/20' : 'border-white/[0.05] bg-black/10 opacity-55'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : s.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right"
                        aria-expanded={expanded}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-200">{s.title}</p>
                          {s.subtitle && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{s.subtitle}</p>}
                        </div>
                        <span className={`shrink-0 text-[10px] text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>

                      {expanded && (
                        <div className="space-y-2 border-t border-white/[0.06] px-4 py-3">
                          {description && (
                            <p className="whitespace-pre-wrap text-xs leading-6 text-zinc-400">{description}</p>
                          )}
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
                          {!description && !url && (
                            <p className="text-[11px] text-zinc-600">توضیح یا لینکی برای این بخش ثبت نشده است.</p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] ${s.managedBy === 'admin' ? 'border border-flag-500/30 text-flag-300' : 'bg-white/[0.06] text-zinc-500'}`}>
                              {s.managedBy === 'admin' ? 'ثبت‌شده توسط ادمین' : 'ثبت‌شده توسط شما'}
                            </span>
                            <button
                              type="button"
                              disabled={busy || s.managedBy === 'admin'}
                              onClick={() => toggleVisible(s)}
                              className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-zinc-400 hover:border-signal-500/40 disabled:opacity-40"
                            >
                              {s.isVisible ? 'پنهان کن' : 'نمایش بده'}
                            </button>
                            <button
                              type="button"
                              disabled={busy || s.managedBy === 'admin'}
                              onClick={() => remove(s)}
                              className="rounded-lg border border-rose-500/25 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
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
            </li>
          ))}
        </ul>
      )}

      {/* Add form — adapts to selected kind */}
      <div className="space-y-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
        <div className="grid grid-cols-[130px_1fr] gap-2">
          <select
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-signal-500"
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k.key} value={k.key}>{k.label}</option>
            ))}
          </select>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder={copy.title}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-signal-500"
          />
        </div>
        {copy.subtitle && (
          <label className="block">
            <span className="mb-1 block text-[10px] text-zinc-500">{copy.subtitleLabel}</span>
            <input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              placeholder={copy.subtitle}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-signal-500"
            />
          </label>
        )}
        {copy.description && (
          <textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder={copy.description}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs leading-6 text-zinc-100 outline-none focus:border-signal-500"
          />
        )}
        {copy.url && (
          <input
            dir="ltr"
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            placeholder={copy.url}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left font-mono text-xs text-zinc-100 outline-none focus:border-signal-500"
          />
        )}

        {error && <p className="text-[11px] text-rose-300">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={add}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-signal-500/30 bg-signal-500/10 px-4 text-xs font-medium text-signal-300 hover:bg-signal-500/20 disabled:opacity-50"
        >
          {busy && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          + افزودن به رزومه
        </button>
      </div>
    </section>
  )
}
