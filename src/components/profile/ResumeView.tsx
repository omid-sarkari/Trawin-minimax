'use client'

/**
 * Living Resume — Developer View (p3.md §10-A, §23).
 * Professional portfolio feel: verified evidence visually distinct from
 * self-reported content. Custom sections editable inline (§16 + admin
 * addendum: DB-persisted, toggleable).
 */

import { useMemo, useState } from 'react'
import type { DeveloperResume, ResumeSectionEntry } from '@/services/resume/living-resume.service'
import { SectionManager } from '@/components/profile/SectionManager'

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

function CompletenessRing({ percent }: { percent: number }) {
  const angle = Math.round(percent * 3.6)
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-signal-500) ${angle}deg, rgba(255,255,255,0.06) ${angle}deg)`,
        }}
      >
        <div className="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full bg-zinc-950">
          <span className="font-mono text-lg font-bold text-zinc-50" dir="ltr">{percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-300">تکمیل رزومه</p>
        <p className="mt-0.5 text-[11px] text-zinc-600">بر اساس مدل امتیازدهی داده‌محور</p>
      </div>
    </div>
  )
}

export function ResumeView({ initial }: { initial: DeveloperResume }) {
  const [sections, setSections] = useState<ResumeSectionEntry[]>(initial.sections)
  const [showHidden, setShowHidden] = useState(true)

  const visibleSections = useMemo(
    () => (showHidden ? sections : sections.filter((s) => s.isVisible)),
    [sections, showHidden],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, ResumeSectionEntry[]>()
    for (const s of visibleSections) {
      map.set(s.kind, [...(map.get(s.kind) ?? []), s])
    }
    return map
  }, [visibleSections])

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* ---- Hero ------------------------------------------------------ */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-signal-500/[0.06] to-transparent">
        <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            {initial.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initial.avatarUrl}
                alt={initial.fullName ?? 'آواتار'}
                className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl text-zinc-500">
                {(initial.fullName ?? '؟').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-zinc-50">{initial.fullName ?? 'بدون نام'}</h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    initial.plan === 'pro'
                      ? 'border-signal-500/40 bg-signal-500/15 text-signal-300'
                      : 'border-white/10 bg-white/5 text-zinc-500'
                  }`}
                >
                  {initial.plan === 'pro' ? 'PRO' : 'FREE'}
                </span>
              </div>
              {initial.username && (
                <p className="mt-1 font-mono text-xs text-zinc-500" dir="ltr">@{initial.username}</p>
              )}
              {initial.headline && (
                <p className="mt-2 text-sm leading-6 text-zinc-300" dir="auto">{initial.headline}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                {initial.targetRole && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5" dir="ltr">
                    {initial.targetRole}
                  </span>
                )}
                {initial.primaryTechnologyName && (
                  <span className="rounded-full border border-signal-500/25 bg-signal-500/10 px-2.5 py-0.5 text-signal-300">
                    {initial.primaryTechnologyName}
                  </span>
                )}
                {initial.experienceYears != null && initial.experienceYears > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5" dir="ltr">
                    {initial.experienceYears}y exp
                  </span>
                )}
                {initial.country && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5">{initial.country}</span>
                )}
              </div>
            </div>
          </div>

          <CompletenessRing percent={initial.completeness.percent} />
        </div>

        {initial.completeness.missing.length > 0 && (
          <div className="border-t border-white/[0.06] px-7 py-4">
            <p className="mb-2 text-[11px] font-medium text-zinc-400">برای تکمیل رزومه:</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
              {initial.completeness.missing.slice(0, 4).map((m) => (
                <li key={m.key} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="h-1 w-1 rounded-full bg-flag-500" />
                  {m.hint}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ---- Bio (self-reported, clearly labeled) ---------------------- */}
      {initial.bio && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">بیوگرافی</h3>
            <span className="rounded-full border border-flag-500/25 bg-flag-500/[0.07] px-2 py-0.5 text-[10px] text-flag-300">
              خوداظهاری
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-8 text-zinc-300">{initial.bio}</p>
        </section>
      )}

      {/* ---- Verified skills (canonical evidence) ---------------------- */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">مهارت‌ها و شواهد</h3>
          <span className="rounded-full border border-signal-500/25 bg-signal-500/[0.07] px-2 py-0.5 text-[10px] text-signal-300">
            ✓ از آزمون‌های تراوین
          </span>
        </div>
        {initial.verifiedSkills.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-zinc-500">هنوز شواهد مهارتی ثبت نشده</p>
            <a href="/dashboard/exams" className="mt-2 inline-block text-xs text-signal-400 hover:text-signal-300">
              با اولین آزمون شروع کن ←
            </a>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {initial.verifiedSkills.map((skill) => (
              <li key={skill.skillId} className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-200">{skill.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        skill.verified
                          ? 'border border-signal-500/40 bg-signal-500/15 text-signal-300'
                          : 'border border-flag-500/30 bg-flag-500/[0.08] text-flag-300'
                      }`}
                      title={skill.levelLabel}
                    >
                      {skill.verified && '✓ '}
                      {skill.levelLabel}
                    </span>
                  </div>
                  <span className={`font-mono text-sm font-bold ${skill.score != null ? 'text-zinc-100' : 'text-zinc-600'}`} dir="ltr">
                    {skill.score != null ? `${skill.score}%` : '—'}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={`h-full rounded-full ${skill.verified ? 'bg-signal-500' : 'bg-flag-500'}`}
                    style={{ width: `${Math.min(100, skill.score ?? 0)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] leading-4 text-zinc-600" dir="ltr">
                  {skill.evidence.gradedQuestions} graded Q · {skill.evidence.completedExams} exams ·{' '}
                  {skill.evidence.projects} projects · confidence {(skill.confidence ?? 0).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[10px] leading-5 text-zinc-700">
          تأیید مهارت طبق سیاست موتور ارزیابی انجام می‌شود؛ نمره خوب در یکی دو سؤال کافی نیست.
        </p>
      </section>

      {/* ---- PRO insights (plan-gated) ---------------------------------- */}
      {initial.plan === 'pro' && initial.insights && (
        <section className="relative overflow-hidden rounded-2xl border border-signal-500/25 bg-gradient-to-b from-signal-500/[0.06] to-transparent p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">تحلیل پیشرفته مهارت</h3>
            <span className="rounded-full border border-signal-500/40 bg-signal-500/15 px-2 py-0.5 text-[10px] font-bold text-signal-300">
              PRO
            </span>
          </div>

          <p className="mb-4 text-xs leading-6 text-zinc-400">{initial.insights.summary}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-semibold text-signal-300">نقاط قوت</p>
              {initial.insights.strengths.length === 0 ? (
                <p className="text-[11px] leading-5 text-zinc-600">هنوز حوزه‌ای به آستانه قوت نرسیده.</p>
              ) : (
                <ul className="space-y-1.5">
                  {initial.insights.strengths.map((s) => (
                    <li key={s.name} className="flex items-center justify-between rounded-lg border border-signal-500/15 bg-black/20 px-3 py-2">
                      <span className="truncate text-xs text-zinc-200">{s.name}</span>
                      <span className="font-mono text-xs font-bold text-signal-400" dir="ltr">{s.score}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold text-flag-300">نیازمند تمرین</p>
              {initial.insights.weaknesses.length === 0 ? (
                <p className="text-[11px] leading-5 text-zinc-600">حوزه ضعیف مشخصی ثبت نشده.</p>
              ) : (
                <ul className="space-y-1.5">
                  {initial.insights.weaknesses.map((w) => (
                    <li key={w.name} className="rounded-lg border border-flag-500/20 bg-black/20 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-zinc-200">{w.name}</span>
                        <span className="font-mono text-xs font-bold text-flag-300" dir="ltr">{w.score}%</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-4 text-zinc-600">{w.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---- Assessment stats ------------------------------------------ */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <p className="font-mono text-2xl font-bold text-zinc-50" dir="ltr">{initial.stats.totalAssessments}</p>
          <p className="mt-1 text-[11px] text-zinc-500">آزمون کامل‌شده</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <p className="font-mono text-2xl font-bold text-zinc-50" dir="ltr">{initial.stats.averageScore}</p>
          <p className="mt-1 text-[11px] text-zinc-500">میانگین نمره</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <p className="font-mono text-2xl font-bold text-signal-400" dir="ltr">{initial.stats.bestScore}</p>
          <p className="mt-1 text-[11px] text-zinc-500">بهترین نمره</p>
        </div>
      </section>

      {/* ---- Recent assessments ---------------------------------------- */}
      {initial.recentEvaluations.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">آزمون‌های اخیر</h3>
          <ul className="space-y-2">
            {initial.recentEvaluations.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                <span className="font-mono text-[11px] text-zinc-600" dir="ltr">
                  #{e.id.slice(0, 8)}
                </span>
                <div className="flex items-center gap-3">
                  {e.level && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400" dir="ltr">
                      {e.level}
                    </span>
                  )}
                  <span className="font-mono text-base font-bold text-zinc-100" dir="ltr">{e.score ?? '—'}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- Custom sections (developer-managed) ----------------------- */}
      <SectionManager sections={sections} onChange={setSections} />

      {Object.entries(grouped).length > 0 && (
        <p className="text-center text-[11px] text-zinc-700">
          بخش‌ها بالا مدیریت می‌شوند و بلافاصله در همین رزومه اعمال می‌گردند.
        </p>
      )}

      <label className="flex items-center justify-center gap-2 pb-4 text-[11px] text-zinc-600">
        <input type="checkbox" checked={!showHidden} onChange={(e) => setShowHidden(!e.target.checked)} />
        نمایش فقط بخش‌های قابل‌مشاهده برای دیگران
      </label>
    </div>
  )
}
