import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/admin/service-client'
import {
  DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
} from '@/lib/admin/question-contracts'

export const metadata = { title: 'جزئیات سؤال' }

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const questionId = Number(id)
  if (!Number.isInteger(questionId)) notFound()

  const svc = createServiceClient()
  const [{ data: question }, { data: versions }, { data: skills }, { data: tags }] = await Promise.all([
    svc.from('questions').select('*').eq('id', questionId).maybeSingle(),
    svc.from('question_versions').select('*').eq('question_id', questionId).order('version'),
    svc.from('question_skills')
      .select('weight, skills(name, slug, technology_id)')
      .eq('question_id', questionId),
    svc.from('question_tag_map').select('tag_id, question_tags(name)').eq('question_id', questionId),
  ])

  if (!question) notFound()

  interface SkillRow { weight: number | null; skills: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> | null }
  interface TagRow { tag_id: number; question_tags: { name?: string } | Array<{ name?: string }> | null }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/questions" className="text-xs text-zinc-500 hover:text-zinc-300">→ بازگشت به لیست</Link>
        <span className="font-mono text-[11px] text-zinc-600" dir="ltr">#{question.id}</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-lg font-semibold text-zinc-50">
          {(versions ?? []).slice(-1)[0]?.title ?? question.slug}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-zinc-400">
            {QUESTION_TYPE_LABELS[question.type as keyof typeof QUESTION_TYPE_LABELS] ?? question.type}
          </span>
          <span className="rounded-full border border-flag-500/30 bg-flag-500/10 px-2.5 py-0.5 text-flag-300">
            سختی {question.difficulty} — {DIFFICULTY_LABELS[question.difficulty ?? 0]}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 ${
              question.status === 'published'
                ? 'border-signal-500/30 bg-signal-500/10 text-signal-300'
                : 'border-white/10 bg-white/5 text-zinc-400'
            }`}
          >
            {QUESTION_STATUS_LABELS[question.status as keyof typeof QUESTION_STATUS_LABELS] ?? question.status}
          </span>
        </div>
        <p className="mt-2 font-mono text-[11px] text-zinc-600" dir="ltr">{question.slug}</p>
      </div>

      {(skills ?? []).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-zinc-200">مهارت‌های مرتبط</h2>
          <ul className="mt-3 space-y-2">
            {(skills as unknown as SkillRow[]).map((s) => {
              const skill = Array.isArray(s.skills) ? s.skills[0] : s.skills
              return (
                <li key={skill?.slug ?? String(s.weight)} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-zinc-400" dir="ltr">{skill?.slug}</span>
                  <span className="font-mono text-xs text-signal-400" dir="ltr">w={s.weight}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(tags ?? []).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-zinc-200">تگ‌ها</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(tags as unknown as TagRow[]).map((t) => {
              const tag = Array.isArray(t.question_tags) ? t.question_tags[0] : t.question_tags
              return (
                <span key={t.tag_id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {tag?.name ?? `#${t.tag_id}`}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">تاریخچه نسخه‌ها</h2>
        <ul className="space-y-3">
          {[...(versions ?? [])].reverse().map((v) => (
            <li key={v.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <p className="text-sm font-medium text-zinc-200">{v.title}</p>
                <span className="font-mono text-[11px] text-zinc-600" dir="ltr">v{v.version}</span>
              </div>
              {v.description && <p className="px-5 pt-3 text-xs leading-6 text-zinc-500">{v.description}</p>}
              <pre dir="ltr" className="max-h-72 overflow-auto whitespace-pre-wrap break-all px-5 py-3 text-left font-mono text-[11px] leading-5 text-zinc-400">
                {JSON.stringify(v.content, null, 2)}
              </pre>
              {v.test_cases != null && (
                <details className="border-t border-white/[0.06] px-5 py-3">
                  <summary className="cursor-pointer text-xs text-signal-400">test cases</summary>
                  <pre dir="ltr" className="mt-2 whitespace-pre-wrap break-all text-left font-mono text-[11px] text-zinc-500">
                    {JSON.stringify(v.test_cases, null, 2)}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
