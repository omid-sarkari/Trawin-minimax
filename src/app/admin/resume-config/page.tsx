'use client'

/**
 * Resume visibility configuration (p3.md §35) — toggles the
 * resume_visibility_rules rows. Server enforces these on every resume
 * payload; this UI never hardcodes rules.
 */

import { useCallback, useEffect, useState } from 'react'
import { Btn, fetchJson } from '@/components/admin/ui'

type Rules = Record<string, Array<{ section_key: string; label: string; enabled: boolean; sort_order: number }>>

interface VerificationPolicy {
  version: number
  verified: { min_graded_questions: number; min_completed_exams: number; min_projects: number; min_score: number }
  emerging: { min_graded_questions: number; min_completed_exams: number; min_score: number }
}

const VIEW_TITLES: Record<string, string> = {
  developer: 'نمای دولوپر (خودش)',
  company: 'نمای شرکت / کارفرما',
  pro: 'قابلیت‌های Pro',
}

const VIEW_HINTS: Record<string, string> = {
  developer: 'بخش‌هایی که خود دولوپر در رزومه‌اش می‌بیند.',
  company: 'چیزی که شرکت‌ها مجاز به دیدن آن هستند — سرور بخش‌های خاموش را اصلاً ارسال نمی‌کند.',
  pro: 'امکانات اضافه پلن Pro.',
}

export default function AdminResumeConfigPage() {
  const [rules, setRules] = useState<Rules | null>(null)
  const [policy, setPolicy] = useState<VerificationPolicy | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [policyMessage, setPolicyMessage] = useState<string | null>(null)

  // Raw TEXT drafts for policy inputs — typing/clearing stays natural;
  // numbers are parsed only at save (server clamps authoritatively).
  const [draft, setDraft] = useState<Record<string, string>>({})
  const dirtyRef = { current: false }

  function syncDraft(p: VerificationPolicy) {
    setDraft({
      vq: String(p.verified.min_graded_questions),
      ve: String(p.verified.min_completed_exams),
      vp: String(p.verified.min_projects),
      vs: String(p.verified.min_score),
      eq: String(p.emerging.min_graded_questions),
      ee: String(p.emerging.min_completed_exams),
      es: String(p.emerging.min_score),
    })
  }

  const load = useCallback(() => {
    fetchJson<{ rules: Rules; policy: VerificationPolicy }>('/api/admin/resume-config')
      .then((d) => {
        setRules(d.rules)
        setPolicy(d.policy)
        if (!dirtyRef.current) syncDraft(d.policy)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'خطا'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function setField(key: string, raw: string) {
    dirtyRef.current = true
    // Only digits — keeps the field clean while staying fully editable.
    setDraft((d) => ({ ...d, [key]: raw.replace(/[^0-9]/g, '').slice(0, 5) }))
  }

  async function toggle(viewType: string, row: { section_key: string; enabled: boolean }) {
    setBusyKey(`${viewType}:${row.section_key}`)
    setError(null)
    try {
      await fetchJson('/api/admin/resume-config', {
        method: 'PATCH',
        body: JSON.stringify({
          view_type: viewType,
          section_key: row.section_key,
          enabled: !row.enabled,
        }),
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusyKey(null)
    }
  }

  async function savePolicy() {
    if (!policy) return
    setBusyKey('policy')
    setError(null)
    setPolicyMessage(null)

    // Client-side parse with sane fallbacks; server clamps + validates again.
    const num = (raw: string | undefined, fallback: number) => {
      const n = Number(raw)
      return Number.isFinite(n) && n >= 0 && String(n) === raw?.replace(/^0+(?=\d)/, '') ? Math.round(n) : Number.isFinite(n) ? Math.round(n) : fallback
    }
    const body = {
      policy: {
        verified: {
          min_graded_questions: num(draft.vq, policy.verified.min_graded_questions),
          min_completed_exams: num(draft.ve, policy.verified.min_completed_exams),
          min_projects: num(draft.vp, policy.verified.min_projects),
          min_score: num(draft.vs, policy.verified.min_score),
        },
        emerging: {
          min_graded_questions: num(draft.eq, policy.emerging.min_graded_questions),
          min_completed_exams: num(draft.ee, policy.emerging.min_completed_exams),
          min_score: num(draft.es, policy.emerging.min_score),
        },
      },
    }

    try {
      const d = await fetchJson<{ ok: boolean; version: number }>('/api/admin/resume-config', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setPolicyMessage(`سیاست نسخه v${d.version} ذخیره شد — از این لحظه موتور ارزیابی با آستانه جدید تصمیم می‌گیرد.`)
      dirtyRef.current = false
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusyKey(null)
    }
  }

  if (error && !rules) {
    return <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-300">{error}</p>
  }

  if (!rules || !policy) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        ))}
      </div>
    )
  }

  const numField = (
    label: string,
    draftKey: string,
    hint: string,
  ) => (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-zinc-400">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={draft[draftKey] ?? ''}
        onChange={(e) => setField(draftKey, e.target.value)}
        placeholder="0"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left font-mono text-sm text-zinc-100 outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
      />
      <span className="mt-0.5 block text-[10px] text-zinc-600">{hint}</span>
    </label>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-16">
      {/* ---- Skill verification policy (decision engine) ------------------ */}
      <section className="rounded-2xl border border-signal-500/20 bg-gradient-to-b from-signal-500/[0.05] to-transparent p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">قواعد تأیید مهارت</h3>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-500" dir="ltr">
            v{policy.version} · active
          </span>
        </div>
        <p className="mb-5 text-[11px] leading-6 text-zinc-500">
          مهارت فقط بعد از عبور از این آستانه‌ها «تأییدشده» می‌شود. هر ذخیره یک نسخه جدید در موتور ارزیابی ثبت می‌کند و تاریخچه حفظ می‌ماند.
        </p>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-signal-300">تأییدشده ✓</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {numField('حداقل سؤال نمره‌داده', 'vq', 'کل پاسخ‌های نمره‌داده مرتبط با مهارت')}
              {numField('حداقل آزمون کامل', 've', 'جلسه آزمون با وضعیت completed')}
              {numField('حداقل پروژه/مسابقه', 'vp', 'بخش‌های پروژه/مسابقه قابل‌مشاهده')}
              {numField('حداقل نمره %', 'vs', 'میانگین نمره مهارت')}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-flag-300">در حال شکل‌گیری</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {numField('حداقل سؤال نمره‌داده', 'eq', 'زیر سقف تأیید، بالای این حد')}
              {numField('حداقل آزمون کامل', 'ee', 'حداقل حضور در آزمون')}
              {numField('حداقل نمره %', 'es', 'نمره قابل قبول اولیه')}
            </div>
          </div>

          {policyMessage && <p className="text-[11px] leading-6 text-signal-300">{policyMessage}</p>}
          {error && <p className="text-[11px] leading-6 text-rose-300">{error}</p>}

          <Btn variant="primary" disabled={busyKey === 'policy'} onClick={savePolicy}>
            {busyKey === 'policy' ? '…' : 'ذخیره سیاست (نسخه جدید)'}
          </Btn>
        </div>
      </section>

      {/* ---- Visibility rules --------------------------------------------- */}
      {Object.entries(rules).map(([viewType, rows]) => (
        <section key={viewType} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="text-sm font-semibold text-zinc-100">{VIEW_TITLES[viewType] ?? viewType}</h3>
          <p className="mb-4 mt-1 text-[11px] leading-5 text-zinc-600">{VIEW_HINTS[viewType]}</p>

          <ul className="space-y-1.5">
            {rows.map((row) => {
              const key = `${viewType}:${row.section_key}`
              return (
                <li key={row.section_key} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/20 px-4 py-2.5">
                  <span className="text-xs text-zinc-300">{row.label}</span>
                  <button
                    type="button"
                    disabled={busyKey === key}
                    onClick={() => toggle(viewType, row)}
                    role="switch"
                    aria-checked={row.enabled}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      row.enabled ? 'bg-signal-500' : 'bg-white/10'
                    } ${busyKey === key ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        row.enabled ? 'right-0.5' : 'right-[22px]'
                      }`}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="rounded-xl border border-flag-500/20 bg-flag-500/[0.05] px-4 py-3 text-[11px] leading-6 text-zinc-400">
        این تنظیمات سمت سرور اعمال می‌شوند؛ بخش غیرفعال حتی به مرورگر ارسال نمی‌شود.
        سیگنال‌های رفتاری داخلی همیشه از نمای شرکت محافظت می‌شوند (§36).
      </p>
    </div>
  )
}
