'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Btn, Card, Field, fetchJson, inputClass } from '@/components/admin/ui'
import {
  BULK_IMPORT_EXAMPLE,
  DIFFICULTY_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type BulkItem,
} from '@/lib/admin/question-contracts'

interface PreviewRow {
  index: number
  valid: boolean
  errors: string[]
}

export default function BulkImportPage() {
  const [bootstrap, setBootstrap] = useState<{
    technologies: Array<{ id: number; name: string }>
    skills: Array<{ id: number; technology_id: number; name: string }>
  } | null>(null)
  const [technologyId, setTechnologyId] = useState('')
  const [skillWeights, setSkillWeights] = useState<Record<number, number>>({})
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState<{ total: number; invalidCount: number } | null>(null)
  const [result, setResult] = useState<{ imported?: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJson<typeof bootstrap>('/api/admin/bootstrap').then((b) => setBootstrap(b)).catch(() => {})
  }, [])

  const techSkills = useMemo(
    () => (bootstrap ? bootstrap.skills.filter((s) => s.technology_id === Number(technologyId)) : []),
    [bootstrap, technologyId]
  )

  async function runPreviewOrCommit(commit: boolean) {
    setError(null)
    setBusy(true)
    setResult(null)
    try {
      const parsed = JSON.parse(jsonText) as unknown
      if (!Array.isArray(parsed)) throw new Error('ورودی باید آرایه JSON باشد.')
      const items = parsed as BulkItem[]

      const data = await fetchJson<{
        preview: boolean
        result?: { imported: number }
        rows?: PreviewRow[]
        total?: number
        invalidCount?: number
      }>('/api/admin/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({
          commit,
          json: jsonText,
          technology_id: Number(technologyId),
          skill_weights: Object.fromEntries(Object.entries(skillWeights).map(([k, v]) => [k, v])),
        }),
      })

      if (data.preview) {
        setPreview({ total: data.total ?? 0, invalidCount: data.invalidCount ?? 0 })
        setRows(data.rows ?? [])
        setResult(null)
      } else {
        setResult({ imported: data.result?.imported ?? 0 })
        setPreview(null)
        setRows([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
      setPreview(null)
    } finally {
      setBusy(false)
    }
  }

  const [rows, setRows] = useState<PreviewRow[]>([])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-50">ایمپورت گروهی سؤالات</h2>
          <Badge tone="flag">اعمال اتمی — همه یا هیچ</Badge>
        </div>
        <p className="text-xs leading-6 text-zinc-500">
          مقادیر زیر به‌عنوان پیش‌فرض روی همه سؤالات اعمال می‌شود (مگر اینکه داخل JSON هر ردیف override شده باشد).
          نوشتن در دیتابیس فقط بعد از تأیید پیش‌نمایش و به‌صورت یک تراکنش انجام می‌شود.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="۱) تکنولوژی">
            <select
              className={inputClass}
              value={technologyId}
              onChange={(e) => { setTechnologyId(e.target.value); setSkillWeights({}) }}
            >
              <option value="">انتخاب کنید…</option>
              {(bootstrap?.technologies ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="۲) سختی پیش‌فرض">
            <select className={inputClass} disabled value={3}>
              {[3].map((d) => (
                <option key={d} value={d}>{`${DIFFICULTY_LABELS[d]} (قابل override در JSON)`}</option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">۳) مهارت‌ها + وزن</p>
          {techSkills.length === 0 ? (
            <p className="text-xs text-zinc-600">ابتدا تکنولوژی را انتخاب کنید.</p>
          ) : (
            <ul className="space-y-2">
              {techSkills.map((skill) => {
                const active = skillWeights[skill.id] !== undefined
                return (
                  <li key={skill.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSkillWeights((w) => {
                          const next = { ...w }
                          if (active) delete next[skill.id]
                          else next[skill.id] = 1
                          return next
                        })
                      }
                      className={`h-4 w-4 shrink-0 rounded border ${active ? 'border-signal-500 bg-signal-500' : 'border-white/25'}`}
                    />
                    <span className="flex-1 text-sm text-zinc-300">{skill.name}</span>
                    {active && (
                      <input
                        type="number" min={0} max={1} step={0.1}
                        value={skillWeights[skill.id]}
                        onChange={(e) => setSkillWeights((w) => ({ ...w, [skill.id]: Number(e.target.value) }))}
                        className="w-20 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-left font-mono text-xs text-zinc-200"
                        dir="ltr"
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <Field label="۴) JSON سؤالات">
          <textarea
            dir="ltr"
            rows={12}
            className={`${inputClass} text-left font-mono text-xs leading-5`}
            placeholder={BULK_IMPORT_EXAMPLE.slice(0, 120) + ' …'}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
        </Field>

        <details className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <summary className="cursor-pointer text-xs font-medium text-signal-400">نمایش قالب نمونه (کپی کن!)</summary>
          <pre dir="ltr" className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-all text-left font-mono text-[11px] leading-5 text-zinc-500">
{BULK_IMPORT_EXAMPLE}
          </pre>
          <Btn variant="ghost" className="mt-3 h-8 px-3 text-xs" onClick={() => navigator.clipboard.writeText(BULK_IMPORT_EXAMPLE)}>
            کپی قالب نمونه
          </Btn>
        </details>

        {error && <Alert kind="error" message={error} />}
        {result && (
          <Alert kind="success" message={`${result.imported ?? 0} سؤال با موفقیت و به‌صورت اتمی وارد شد ✓`} />
        )}

        <div className="flex flex-wrap gap-3">
          <Btn variant="ghost" disabled={!jsonText || busy} onClick={() => runPreviewOrCommit(false)}>
            بررسی و پیش‌نمایش
          </Btn>
          <Btn
            variant="primary"
            disabled={!preview || preview.invalidCount > 0 || busy}
            onClick={() => runPreviewOrCommit(true)}
          >
            تایید نهایی و ایمپورت اتمی
          </Btn>
        </div>
      </Card>

      {preview && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={preview.invalidCount > 0 ? 'rose' : 'signal'}>
              {preview.invalidCount > 0 ? `${preview.invalidCount} ردیف نامعتبر` : 'همه ردیف‌ها معتبرند ✓'}
            </Badge>
            <span className="text-xs text-zinc-500">مجموع: {preview.total} سؤال</span>
          </div>
          <ul className="max-h-72 space-y-1.5 overflow-auto">
            {rows.map((row) => (
              <li key={row.index} className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-xs">
                <span className="font-mono text-zinc-600" dir="ltr">#{row.index}</span>
                {row.valid ? (
                  <span className="text-signal-400">✓ معتبر</span>
                ) : (
                  <span className="text-rose-300">✗ {row.errors.join(' · ')}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
