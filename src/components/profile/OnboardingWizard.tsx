'use client'

/**
 * Onboarding wizard (p3.md §3-§7).
 * Every step persists immediately → refresh resumes where you left off.
 * Technologies come from the DB; intents from the shared options module.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ONBOARDING_INTENTS,
  TARGET_ROLE_SUGGESTIONS,
  EXPERIENCE_LEVELS,
  WORK_PREFERENCES,
} from '@/lib/profile/onboarding-options'

interface Tech { id: number; name: string; category: string }
interface InitialState {
  intents: string[]
  primaryTechnologyId: number | null
  targetRole: string
  experienceLevel: string
  workPreference: string[]
}

const STEPS = ['هدف تو', 'تکنولوژی', 'نقش هدف', 'تجربه', 'ترجیح کاری'] as const

async function save(body: Record<string, unknown>) {
  const res = await fetch('/api/profile/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'خطا در ذخیره')
  }
}

export function OnboardingWizard({ technologies, initial }: { technologies: Tech[]; initial: InitialState }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [intents, setIntents] = useState<string[]>(initial.intents)
  const [techId, setTechId] = useState<number | null>(initial.primaryTechnologyId)
  const [targetRole, setTargetRole] = useState(initial.targetRole)
  const [experience, setExperience] = useState(initial.experienceLevel)
  const [workPrefs, setWorkPrefs] = useState<string[]>(initial.workPreference)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function advance(finalize: boolean) {
    setError(null)
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        step: STEPS[step],
        intents,
        primary_technology_id: techId,
        target_role: targetRole,
        experience_level: experience,
        work_preference: workPrefs,
        finalize,
      }
      await save(payload)
      if (finalize) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setStep((s) => Math.min(s + 1, STEPS.length - 1))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  const canProceed =
    step === 0 ? intents.length > 0
    : step === 1 ? techId !== null
    : step === 2 ? targetRole.trim().length >= 2
    : step === 3 ? experience !== ''
    : workPrefs.length > 0

  return (
    <div className="mx-auto max-w-xl pb-16">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`h-1.5 w-full rounded-full transition-colors ${
                i <= step ? 'bg-signal-500' : 'bg-white/[0.07]'
              }`}
            />
            <span className={`text-[10px] ${i === step ? 'text-signal-300' : 'text-zinc-600'}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
        <h2 className="mb-1 text-lg font-bold text-zinc-50">{STEPS[step]}</h2>
        <p className="mb-6 text-xs leading-6 text-zinc-500">
          {step === 0 && 'اصلی‌ترین دلیلت از آمدن به تراوین چیست؟ (چند گزینه مجاز است)'}
          {step === 1 && 'دوست داری با کدام تکنولوژی شروع کنی؟'}
          {step === 2 && 'چه نقشی را هدف گرفته‌ای؟'}
          {step === 3 && 'الان تجربه‌ات را چطور توصیف می‌کنی؟ (خوداظهاری — بعدها با آزمون تأیید می‌شود)'}
          {step === 4 && 'دنبال چه نوع همکاری هستی؟'}
        </p>

        {step === 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ONBOARDING_INTENTS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(intents, opt.key, setIntents)}
                className={`rounded-xl border px-4 py-3 text-right text-sm transition-colors ${
                  intents.includes(opt.key)
                    ? 'border-signal-500/60 bg-signal-500/10 text-signal-200'
                    : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/25'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {technologies.length === 0 && (
              <p className="col-span-full py-4 text-center text-xs text-zinc-600">هنوز تکنولوژی‌ای ثبت نشده است.</p>
            )}
            {technologies.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTechId(t.id)}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  techId === t.id
                    ? 'border-signal-500/60 bg-signal-500/10 text-signal-200'
                    : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/25'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="مثلاً Frontend Developer"
              dir="ltr"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-left font-mono text-sm text-zinc-100 outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25"
            />
            <div className="flex flex-wrap gap-2">
              {TARGET_ROLE_SUGGESTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  dir="ltr"
                  className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-signal-500/40 hover:text-signal-300"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button
                key={lvl.key}
                type="button"
                onClick={() => setExperience(lvl.key)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                  experience === lvl.key
                    ? 'border-signal-500/60 bg-signal-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                <span className={`text-sm ${experience === lvl.key ? 'text-signal-200' : 'text-zinc-300'}`}>{lvl.label}</span>
                <span className="text-[11px] text-zinc-600">{lvl.hint}</span>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-wrap gap-2">
            {WORK_PREFERENCES.map((pref) => (
              <button
                key={pref.key}
                type="button"
                onClick={() => toggle(workPrefs, pref.key, setWorkPrefs)}
                className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                  workPrefs.includes(pref.key)
                    ? 'border-signal-500/60 bg-signal-500/10 text-signal-200'
                    : 'border-white/10 text-zinc-300 hover:border-white/25'
                }`}
              >
                {pref.label}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-4 text-xs leading-6 text-rose-300">{error}</p>}

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => s - 1)}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-zinc-300 transition-colors hover:border-white/35 disabled:opacity-40"
          >
            قبلی
          </button>
          <button
            type="button"
            disabled={!canProceed || busy}
            onClick={() => (step === STEPS.length - 1 ? advance(true) : advance(false))}
            className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-6 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400 disabled:opacity-50"
          >
            {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {step === STEPS.length - 1 ? 'پایان و ورود به داشبورد' : 'ادامه'}
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] leading-5 text-zinc-600">
        هر مرحله بلافاصله ذخیره می‌شود؛ اگر صفحه را رفرش کنی از همین‌جا ادامه می‌دهی.
      </p>
    </div>
  )
}
