'use client'

/**
 * Profile editor (p3.md §15-§17): self-reported info only. Verified
 * evidence is rendered exclusively by the resume from canonical data.
 * Username: live availability check + centralized reserved-name policy.
 */

import { useEffect, useState } from 'react'
import { WORK_PREFERENCES } from '@/lib/profile/onboarding-options'

interface Tech { id: number; name: string }
interface InitialState {
  fullName: string
  avatarUrl: string
  headline: string
  bio: string
  country: string
  experienceYears: number
  targetRole: string
  workPreference: string[]
  primaryTechnologyId: number | null
  username: string
}

const BIO_MAX = 2000

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'خطا')
  return data as T
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25'

export function ProfileEditor({ initial, technologies }: { initial: InitialState; technologies: Tech[] }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Experience kept as raw text so the field behaves naturally while typing;
  // parsed (and clamped) only at save time.
  const [experienceText, setExperienceText] = useState(
    initial.experienceYears > 0 ? String(initial.experienceYears) : '',
  )
  const experienceYearsParsed = (() => {
    const n = Number(experienceText)
    return experienceText.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 60 ? Math.round(n) : 0
  })()

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  async function uploadAvatar(file: File) {
    setAvatarError(null)
    setAvatarUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'آپلود ناموفق بود')
      set('avatarUrl', (data as { url: string }).url)
      setMessage({ kind: 'ok', text: 'عکس پروفایل به‌روزرسانی شد ✓ (برای نهایی شدن، ذخیره را بزنید)' })
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'خطا در آپلود')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Username claim state
  const [usernameDraft, setUsernameDraft] = useState(initial.username)
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [usernameHint, setUsernameHint] = useState<string | null>(null)

  useEffect(() => {
    if (usernameDraft === initial.username) {
      setUsernameCheck('idle')
      setUsernameHint(null)
      return
    }
    const t = setTimeout(async () => {
      setUsernameCheck('checking')
      try {
        const r = await api<{ available: boolean; reason?: string }>(
          `/api/profile/username?u=${encodeURIComponent(usernameDraft)}`,
        )
        setUsernameCheck(r.available ? 'ok' : 'taken')
        setUsernameHint(r.reason ?? null)
      } catch {
        setUsernameCheck('idle')
      }
    }, 500)
    return () => clearTimeout(t)
  }, [usernameDraft, initial.username])

  function set<K extends keyof InitialState>(key: K, value: InitialState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.fullName,
          avatarUrl: form.avatarUrl,
          headline: form.headline,
          bio: form.bio,
          country: form.country,
          experienceYears: experienceYearsParsed,
          targetRole: form.targetRole,
          workPreference: form.workPreference,
          primaryTechnologyId: form.primaryTechnologyId,
        }),
      })
      if (usernameDraft !== initial.username && usernameCheck === 'ok') {
        await api('/api/profile/username', {
          method: 'POST',
          body: JSON.stringify({ username: usernameDraft }),
        })
      }
      setMessage({ kind: 'ok', text: 'پروفایل ذخیره شد ✓' })
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'خطا در ذخیره' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      {/* Identity */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">هویت حرفه‌ای</h3>
        <div className="space-y-4">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatarUrl}
                alt="آواتار"
                className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 text-xl text-zinc-600">
                {(form.fullName ?? '؟').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <label
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 text-xs text-zinc-300 transition-colors hover:border-signal-500/40 ${
                  avatarUploading ? 'opacity-50' : ''
                }`}
              >
                {avatarUploading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                {avatarUploading ? 'در حال آپلود…' : '📷 انتخاب عکس پروفایل'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadAvatar(file)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
              {avatarError && <p className="mt-1.5 text-[11px] text-rose-300">{avatarError}</p>}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">نام نمایشی</span>
            <input className={inputCls} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="مثلاً امید سرکاری" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">تیتر حرفه‌ای</span>
            <input className={inputCls} value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="مثلاً Frontend Developer | React & Next.js" dir="ltr" />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">کشور</span>
              <input className={inputCls} value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="ایران" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">سال تجربه</span>
              <input
                type="number"
                min={0}
                max={60}
                dir="ltr"
                className={`${inputCls} text-left font-mono`}
                value={experienceText}
                onChange={(e) => setExperienceText(e.target.value)}
                placeholder="۰"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">بیوگرافی</h3>
          <span className={`font-mono text-[11px] ${form.bio.length > BIO_MAX ? 'text-rose-400' : 'text-zinc-600'}`} dir="ltr">
            {form.bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          rows={5}
          maxLength={BIO_MAX}
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="درباره مسیر حرفه‌ای‌ات بنویس…"
          className={`${inputCls} resize-y leading-7`}
        />
        <p className="mt-2 text-[11px] text-zinc-600">این متن خوداظهاری است و به‌عنوان شواهد تأییدشده نمایش داده نمی‌شود.</p>
      </section>

      {/* Skills & preferences */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">تمرکز فنی</h3>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">تکنولوژی اصلی</span>
            <select
              className={inputCls}
              value={form.primaryTechnologyId ?? ''}
              onChange={(e) => set('primaryTechnologyId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— انتخاب کن —</option>
              {technologies.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">نقش هدف</span>
            <input className={inputCls} value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)} dir="ltr" />
          </label>

          <div>
            <span className="mb-2 block text-xs font-medium text-zinc-400">ترجیح کاری</span>
            <div className="flex flex-wrap gap-2">
              {WORK_PREFERENCES.map((pref) => (
                <button
                  key={pref.key}
                  type="button"
                  onClick={() =>
                    set(
                      'workPreference',
                      form.workPreference.includes(pref.key)
                        ? form.workPreference.filter((w) => w !== pref.key)
                        : [...form.workPreference, pref.key],
                    )
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                    form.workPreference.includes(pref.key)
                      ? 'border-signal-500/60 bg-signal-500/10 text-signal-200'
                      : 'border-white/10 text-zinc-300 hover:border-white/25'
                  }`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Username */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">نام کاربری عمومی</h3>
        <p className="mb-4 text-[11px] leading-5 text-zinc-600">
          یکتا، انگلیسی کوچک، مناسب URL — آینده: /developers/@username
        </p>
        <div className="flex items-center gap-2" dir="ltr">
          <span className="font-mono text-lg text-zinc-600">@</span>
          <input
            className={`${inputCls} text-left font-mono`}
            value={usernameDraft}
            onChange={(e) => setUsernameDraft(e.target.value.toLowerCase())}
            placeholder="omid-dev"
          />
          {usernameCheck === 'checking' && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />}
          {usernameCheck === 'ok' && <span className="shrink-0 text-signal-400">✓</span>}
          {usernameCheck === 'taken' && <span className="shrink-0 text-rose-400">✗</span>}
        </div>
        {usernameCheck === 'taken' && usernameHint && (
          <p className="mt-2 text-[11px] text-rose-300">{usernameHint}</p>
        )}
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 rounded-2xl border border-white/10 bg-zinc-950/90 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {message ? (
              <p className={`text-xs leading-5 ${message.kind === 'ok' ? 'text-signal-300' : 'text-rose-300'}`}>{message.text}</p>
            ) : (
              <p className="text-[11px] text-zinc-600">تغییرات فقط با ذخیره اعمال می‌شوند.</p>
            )}
          </div>
          <button
            type="button"
            disabled={saving || usernameCheck === 'taken'}
            onClick={save}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-signal-500 px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400 disabled:opacity-50"
          >
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            ذخیره پروفایل
          </button>
        </div>
      </div>
    </div>
  )
}
