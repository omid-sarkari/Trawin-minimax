'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert, Badge, Btn, Card, Field, cx, fetchJson, inputClass } from '@/components/admin/ui'
import {
  DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  validateContentByType,
  type QuestionType,
} from '@/lib/admin/question-contracts'

interface Bootstrap {
  technologies: Array<{ id: number; name: string; slug: string }>
  skills: Array<{ id: number; technology_id: number; name: string }>
  tags: Array<{ id: number; name: string; slug: string }>
}

interface TestCaseRow {
  input: string
  expected: string
}

const STEPS = ['طبقه‌بندی', 'محتوای سؤال', 'بررسی و ذخیره']

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-[11px] leading-5 text-zinc-600">{children}</span>
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [slug, setSlug] = useState('')
  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [difficulty, setDifficulty] = useState(3)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [technologyId, setTechnologyId] = useState<number | null>(null)
  const [skillWeights, setSkillWeights] = useState<Record<number, number>>({})
  const [tagIds, setTagIds] = useState<number[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [testCases, setTestCases] = useState<TestCaseRow[]>([])

  async function loadBootstrap() {
    setBootError(null)
    try {
      setBootstrap(await fetchJson<Bootstrap>('/api/admin/bootstrap'))
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات دیتابیس')
    }
  }
  useEffect(() => {
    loadBootstrap()
  }, [])

  const techSkills = useMemo(
    () => (bootstrap ? bootstrap.skills.filter((s) => s.technology_id === technologyId) : []),
    [bootstrap, technologyId]
  )
  const totalWeight = Object.values(skillWeights).reduce((a, b) => a + b, 0)

  // ---------- validation ----------
  function step1Problems(): string[] {
    const problems: string[] = []
    if (!/^[a-z0-9-]{3,}$/.test(slug.trim())) problems.push('slug معتبر وارد کنید (حروف کوچک/رقم/خط‌تیره، حداقل ۳ کاراکتر)')
    if (technologyId === null) problems.push('تکنولوژی را انتخاب کنید')
    if (Object.keys(skillWeights).length === 0) problems.push('حداقل یک مهارت انتخاب کنید')
    return problems
  }

  function normalizeContent(): Record<string, unknown> {
    if (type !== 'coding' && type !== 'debugging') return content
    const clean: Record<string, unknown> = { ...content }
    const constraintsText = String(clean.constraints_text ?? '').trim()
    delete clean.constraints_text
    delete clean.examples_text
    clean.constraints = constraintsText
      ? constraintsText.split('\n').map((s) => s.trim()).filter(Boolean)
      : []
    return clean
  }

  function step2Error(): string | null {
    if (title.trim().length < 5) return 'عنوان حداقل ۵ کاراکتر باید باشد.'
    if ((type === 'coding' || type === 'debugging') && !language.trim())
      return 'زبان برنامه‌نویسی را بنویسید (مثل javascript یا python).'
    return validateContentByType(type, normalizeContent())
  }

  async function save() {
    setError(null)
    setSaving(true)
    try {
      await fetchJson('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          slug,
          type,
          difficulty,
          status,
          technology_id: technologyId,
          title,
          description,
          language: type === 'coding' || type === 'debugging' ? language.trim() : null,
          content: normalizeContent(),
          test_cases:
            (type === 'coding' || type === 'debugging') &&
            testCases.some((t) => t.input.trim() || t.expected.trim())
              ? testCases.filter((t) => t.input.trim() || t.expected.trim())
              : null,
          skill_weights: Object.fromEntries(Object.entries(skillWeights).map(([k, v]) => [k, v])),
          tag_ids: tagIds,
        }),
      })
      router.push('/admin/questions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره سؤال')
    } finally {
      setSaving(false)
    }
  }

  // ---------- render ----------
  if (bootError) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-10">
        <Alert kind="error" message={`دریافت اطلاعات دیتابیس ناموفق بود: ${bootError}`} />
        <Btn className="w-full" onClick={loadBootstrap}>تلاش مجدد</Btn>
        <Link href="/admin/questions" className="block text-center text-xs text-zinc-500 hover:text-zinc-300">
          بازگشت به لیست سؤالات
        </Link>
      </div>
    )
  }

  if (!bootstrap) {
    return <p className="pt-10 text-center text-sm text-zinc-500">در حال دریافت تکنولوژی‌ها، مهارت‌ها و تگ‌ها…</p>
  }

  const s1 = step1Problems()
  const s2 = step === 1 || step === 2 ? step2Error() : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Steps header */}
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cx(
                'flex h-7 w-7 items-center justify-center rounded-full border font-mono',
                i === step
                  ? 'border-signal-500 bg-signal-500/15 text-signal-300'
                  : i < step
                    ? 'border-signal-500/30 bg-signal-500/10 text-signal-400'
                    : 'border-white/10 text-zinc-600'
              )}
            >
              {i + 1}
            </span>
            <span className={cx(i === step ? 'font-medium text-zinc-200' : 'text-zinc-500')}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-white/10" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="space-y-6">
          <Field label="نوع سؤال">
            <select className={inputClass} value={type} onChange={(e) => { setType(e.target.value as QuestionType); setContent({}); setTestCases([]) }}>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <Hint>چهارگزینه‌ای: سؤال با چند گزینه و یک پاسخ درست · جای خالی: تکمیل جمله با ___ · برنامه‌نویسی: نوشتن کد واقعی · تشریحی: پاسخ متنی آزاد · دیباگ: پیدا کردن مشکل کد</Hint>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="شناسه یکتا (slug)">
              <input dir="ltr" placeholder="react-hooks-001" className={`${inputClass} text-left font-mono`} value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Hint>انگلیسی و بدون فاصله؛ مثل react-hooks-001 — بعداً برای جستجو و API استفاده می‌شود.</Hint>
            </Field>
            <Field label="سطح سختی">
              <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>{`${d} — ${DIFFICULTY_LABELS[d]}`}</option>
                ))}
              </select>
              <Hint>عدد بین ۱ تا ۵ ذخیره می‌شود؛ موتور تطبیقی بر اساس همین سختی را بالا/پایین می‌برد.</Hint>
            </Field>
          </div>

          <Field label="تکنولوژی">
            <select
              className={inputClass}
              value={technologyId ?? ''}
              onChange={(e) => {
                setTechnologyId(e.target.value ? Number(e.target.value) : null)
                setSkillWeights({})
              }}
            >
              <option value="">انتخاب کنید…</option>
              {(bootstrap?.technologies ?? []).filter((t) => t.slug).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Hint>لیست مستقیم از جدول technologies دیتابیس خوانده می‌شود.</Hint>
          </Field>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              مهارت‌هایی که این سؤال می‌سنجد <span className="text-zinc-600">(با وزن اثر هر مهارت)</span>
            </p>
            {techSkills.length === 0 ? (
              <p className="rounded-lg border border-flag-500/25 bg-flag-500/10 px-3 py-2 text-xs text-flag-300">
                {technologyId
                  ? 'برای این تکنولوژی هنوز مهارتی ثبت نشده — از تب «محتوا» اضافه کنید.'
                  : 'ابتدا تکنولوژی را انتخاب کنید.'}
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {techSkills.map((skill) => {
                    const active = skillWeights[skill.id] !== undefined
                    return (
                      <li key={skill.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-2.5">
                        <button
                          type="button"
                          aria-label={`انتخاب ${skill.name}`}
                          onClick={() =>
                            setSkillWeights((w) => {
                              const next = { ...w }
                              if (active) delete next[skill.id]
                              else next[skill.id] = 1
                              return next
                            })
                          }
                          className={cx('h-4 w-4 shrink-0 rounded border transition-colors', active ? 'border-signal-500 bg-signal-500' : 'border-white/25')}
                        />
                        <span className="flex-1 text-sm text-zinc-300">{skill.name}</span>
                        {active && (
                          <>
                            <input
                              type="number" min={0} max={1} step={0.1}
                              value={skillWeights[skill.id]}
                              onChange={(e) => setSkillWeights((w) => ({ ...w, [skill.id]: Number(e.target.value) }))}
                              className="w-20 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-left font-mono text-xs text-zinc-200"
                              dir="ltr"
                            />
                            <Hint>۰ تا ۱</Hint>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <p className={cx('mt-2 text-xs', Object.keys(skillWeights).length > 1 && Math.abs(totalWeight - 1) >= 0.01 ? 'text-flag-300' : 'text-signal-400')}>
                  مجموع وزن‌ها: {totalWeight.toFixed(2)}
                  {Object.keys(skillWeights).length > 1 && Math.abs(totalWeight - 1) >= 0.01 && ' — پیشنهاد: جمع وزن‌ها ≈ ۱٫۰۰ باشد'}
                </p>
              </>
            )}
          </div>

          {(bootstrap.tags.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">
                تگ‌ها (اختیاری) <Badge tone="zinc">{tagIds.length} انتخاب شده از {bootstrap.tags.length}</Badge>
              </p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-white/[0.07] bg-black/20 p-3">
                {bootstrap.tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setTagIds((ids) => (ids.includes(tag.id) ? ids.filter((x) => x !== tag.id) : [...ids, tag.id]))}
                    className={cx('rounded-full border px-3 py-1 text-xs transition-colors', tagIds.includes(tag.id) ? 'border-signal-500/40 bg-signal-500/15 text-signal-300' : 'border-white/10 text-zinc-400 hover:border-white/25')}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              <Hint>از جدول question_tags دیتابیس خوانده می‌شود؛ مثلاً Promises، Arrays، Interfaces…</Hint>
            </div>
          )}

          {s1.length > 0 && <Alert kind="error" message={`برای ادامه: ${s1.join(' · ')}`} />}

          <div className="flex justify-end">
            <Btn disabled={s1.length > 0} onClick={() => setStep(1)}>مرحله بعد ←</Btn>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-5">
          <Field label="عنوان سؤال">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: خروجی Promise.all هنگام reject شدن یکی از promise ها" />
            <Hint>یک عنوان کوتاه و گویا؛ در لیست سؤالات نمایش داده می‌شود.</Hint>
          </Field>
          <Field label="توضیح کوتاه (اختیاری)">
            <textarea rows={2} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثلاً: سناریویی که در آن دو Promise همزمان اجرا می‌شوند و اولی reject می‌شود." />
          </Field>

          <TypeEditor
            type={type}
            content={content}
            setContent={setContent}
            language={language}
            setLanguage={setLanguage}
            testCases={testCases}
            setTestCases={setTestCases}
          />

          {s2 && <Alert kind="error" message={s2} />}

          <div className="flex items-center justify-between">
            <Btn variant="ghost" onClick={() => setStep(0)}>→ مرحله قبل</Btn>
            <Btn disabled={!!step2Error()} onClick={() => { const err = step2Error(); if (!err) setStep(2); else setError(err) }}>
              مرحله بعد ←
            </Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[['نوع', QUESTION_TYPE_LABELS[type]], ['سختی', `${DIFFICULTY_LABELS[difficulty]}`], ['وضعیت', QUESTION_STATUS_LABELS[status]], ['تکنولوژی', bootstrap?.technologies.find((t) => t.id === technologyId)?.name ?? '—'], ['مهارت‌ها', String(Object.keys(skillWeights).length)], ['تگ‌ها', String(tagIds.length)]].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-zinc-600">{k}</dt>
                <dd className="mt-0.5 text-zinc-300">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="text-sm">
            <dt className="text-xs text-zinc-600">عنوان</dt>
            <dd className="mt-0.5 text-zinc-200">{title}</dd>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4">
            <p className="mb-2 text-xs text-zinc-500">پیش‌نمایش دقیق چیزی که در دیتابیس ذخیره می‌شود</p>
            <pre dir="ltr" className="max-h-56 overflow-auto whitespace-pre-wrap break-all text-left font-mono text-[11px] leading-5 text-zinc-400">
              {JSON.stringify(normalizeContent(), null, 2)}
            </pre>
            {(type === 'coding' || type === 'debugging') && testCases.some((t) => t.input.trim()) && (
              <>
                <p className="mb-2 mt-4 text-xs text-zinc-500">test_cases (ستون اختصاصی جدول question_versions):</p>
                <pre dir="ltr" className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-left font-mono text-[11px] leading-5 text-zinc-400">
                  {JSON.stringify(testCases.filter((t) => t.input.trim() || t.expected.trim()), null, 2)}
                </pre>
              </>
            )}
          </div>

          {error && <Alert kind="error" message={error} />}

          <div className="flex flex-wrap items-center gap-3">
            <Btn variant="ghost" onClick={() => setStep(1)}>← بازگشت</Btn>
            <Btn variant="soft" disabled={saving} onClick={() => { setStatus('draft'); save() }}>
              ذخیره پیش‌نویس
            </Btn>
            <Btn disabled={saving} onClick={() => { setStatus('published'); save() }}>
              انتشار مستقیم
            </Btn>
            {saving && <p className="text-xs text-zinc-500">در حال ذخیره…</p>}
          </div>
        </Card>
      )}
    </div>
  )
}

function TypeEditor({
  type,
  content,
  setContent,
  language,
  setLanguage,
  testCases,
  setTestCases,
}: {
  type: QuestionType
  content: Record<string, unknown>
  setContent: (c: Record<string, unknown>) => void
  language: string
  setLanguage: (l: string) => void
  testCases: TestCaseRow[]
  setTestCases: (rows: TestCaseRow[]) => void
}) {
  if (type === 'multiple_choice') return <McqEditor content={content} setContent={setContent} />
  if (type === 'fill_blank') return <FillBlankEditor content={content} setContent={setContent} />
  if (type === 'open_ended') return <OpenEndedEditor content={content} setContent={setContent} />
  return (
    <CodeLikeEditor
      type={type}
      content={content}
      setContent={setContent}
      language={language}
      setLanguage={setLanguage}
      testCases={testCases}
      setTestCases={setTestCases}
    />
  )
}

interface McqOption {
  id: string
  text: string
  is_correct: boolean
}

function McqEditor({ content, setContent }: { content: Record<string, unknown>; setContent: (c: Record<string, unknown>) => void }) {
  const c = content as Partial<{ question: string; options: McqOption[]; explanation?: string }>
  const options =
    c.options ?? [
      { id: 'A', text: '', is_correct: true },
      { id: 'B', text: '', is_correct: false },
      { id: 'C', text: '', is_correct: false },
      { id: 'D', text: '', is_correct: false },
    ]
  const correctIds = options.filter((o) => o.is_correct).map((o) => o.id)
  const update = (patch: Record<string, unknown>) => setContent({ ...content, ...patch })

  function setOption(index: number, patch: Partial<McqOption>) {
    update({ options: options.map((o, i) => (i === index ? { ...o, ...patch } : o)) })
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <Badge tone="signal">ویرایشگر چهارگزینه‌ای</Badge>
      <Field label="متن سؤال">
        <textarea rows={3} className={inputClass} value={c.question ?? ''} onChange={(e) => update({ question: e.target.value })} placeholder="مثلاً: خروجی کد زیر چه چیزی است؟ console.log([1,2,3].map(x => x * 2))" />
        <Hint>صورت کامل سؤالی که به کاربر نمایش داده می‌شود.</Hint>
      </Field>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500">گزینه‌ها — روی دایرهٔ حروف کلیک کنید تا گزینهٔ درست مشخص شود:</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-3">
            <button
              type="button"
              title="علامت‌گذاری به‌عنوان گزینه درست"
              onClick={() => update({ options: options.map((o, j) => ({ ...o, is_correct: j === i })) })}
              className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors', correctIds.includes(opt.id) ? 'border-signal-500 bg-signal-500/15 text-signal-300' : 'border-white/15 text-zinc-500 hover:border-white/35')}
            >
              {opt.id}
            </button>
            <input
              placeholder={`متن گزینه ${opt.id} — مثلاً: [2,4,6]`}
              className={inputClass}
              value={opt.text}
              onChange={(e) => setOption(i, { text: e.target.value })}
            />
            {options.length > 2 && (
              <button type="button" onClick={() => update({ options: options.filter((_, j) => j !== i) })} className="shrink-0 text-xs text-rose-400/80 hover:text-rose-300">
                حذف
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const lastId = options.length > 0 ? options[options.length - 1].id : '@'
            const nextId = String.fromCharCode(lastId.charCodeAt(lastId.length - 1) + 1)
            update({ options: [...options, { id: nextId, text: '', is_correct: false }] })
          }}
          className="text-xs text-signal-400 hover:text-signal-300"
        >
          + افزودن گزینه (تعداد دلخواه، حداقل ۲)
        </button>
      </div>

      <Field label="توضیح پاسخ (اختیاری)">
        <textarea rows={2} className={inputClass} value={c.explanation ?? ''} onChange={(e) => update({ explanation: e.target.value })} placeholder="مثلاً: متد map روی هر عنصر ضرب انجام داده و آرایه جدید برمی‌گرداند." />
        <Hint>بعد از پاسخ کاربر نمایش داده می‌شود؛ برای یادگیری خیلی مفید است.</Hint>
      </Field>
    </div>
  )
}

const BLANK_TOKEN = '___'

function FillBlankEditor({ content, setContent }: { content: Record<string, unknown>; setContent: (c: Record<string, unknown>) => void }) {
  const c = content as Partial<{ question_with_blank: string; accepted_answers: string[]; explanation?: string }>
  const answers = c.accepted_answers?.join(', ') ?? ''
  const update = (patch: Record<string, unknown>) => setContent({ ...content, ...patch })
  const hasBlank = (c.question_with_blank ?? '').includes(BLANK_TOKEN)

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <Badge tone="flag">ویرایشگر جای خالی</Badge>
      <Field label="جمله با جای خالی">
        <textarea rows={3} dir="auto" className={inputClass} value={c.question_with_blank ?? ''} onChange={(e) => update({ question_with_blank: e.target.value })} placeholder={'مثلاً: متد map روی آرایه یک آرایه ___ برمی\u200cگرداند.'} />
        <Hint>جایی که باید خالی باشد دقیقاً سه زیرخط بنویسید: <code className="font-mono text-zinc-400" dir="ltr">{BLANK_TOKEN}</code></Hint>
      </Field>

      {!hasBlank && (c.question_with_blank ?? '') !== '' && (
        <Alert kind="error" message={`هنوز جای خالی تعیین نکرده‌اید — سه زیرخط (${BLANK_TOKEN}) را داخل جمله بگذارید.`} />
      )}

      {hasBlank && (
        <div className="rounded-lg border border-signal-500/20 bg-signal-500/5 p-3 text-sm leading-7 text-zinc-300">
          پیش‌نمایش: {c.question_with_blank!.split(BLANK_TOKEN)[0]}
          <span className="mx-1 inline-block min-w-16 border-b-2 border-dashed border-signal-400 text-transparent">____</span>
          {c.question_with_blank!.split(BLANK_TOKEN)[1]}
        </div>
      )}

      <Field label="پاسخ‌های قابل قبول (با کاما جدا کنید)">
        <input className={`${inputClass} font-mono`} dir="ltr" value={answers} onChange={(e) => update({ accepted_answers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="new array, آرایه جدید" />
        <Hint>هر کدام از این پاسخ‌ها درست حساب می‌شود؛ بزرگ/کوچکی حروف مهم است.</Hint>
      </Field>
    </div>
  )
}

function OpenEndedEditor({ content, setContent }: { content: Record<string, unknown>; setContent: (c: Record<string, unknown>) => void }) {
  const c = content as Partial<{ prompt: string; guidance?: string }>
  const update = (patch: Record<string, unknown>) => setContent({ ...content, ...patch })
  return (
    <div className="space-y-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <Badge tone="signal">ویرایشگر تشریحی</Badge>
      <Field label="صورت سؤال">
        <textarea rows={4} className={inputClass} value={c.prompt ?? ''} onChange={(e) => update({ prompt: e.target.value })} placeholder="مثلاً: تفاوت Event Loop و Call Stack را با یک مثال توضیح دهید." />
        <Hint>سؤال باز بپرسید؛ پاسخ کاربر بعداً توسط موتور ارزیابی/AI تحلیل می‌شود.</Hint>
      </Field>
      <Field label="راهنمای ارزیابی (اختیاری)">
        <textarea rows={2} className={inputClass} value={c.guidance ?? ''} onChange={(e) => update({ guidance: e.target.value })} placeholder="مثلاً: باید به microtask queue و ترتیب اجرا اشاره کند." />
        <Hint>نکات کلیدی که پاسخ خوب باید داشته باشد — مبنای سنجش کیفیت پاسخ.</Hint>
      </Field>
    </div>
  )
}

function CodeLikeEditor({
  type,
  content,
  setContent,
  language,
  setLanguage,
  testCases,
  setTestCases,
}: {
  type: QuestionType
  content: Record<string, unknown>
  setContent: (c: Record<string, unknown>) => void
  language: string
  setLanguage: (l: string) => void
  testCases: TestCaseRow[]
  setTestCases: (rows: TestCaseRow[]) => void
}) {
  const c = content as Partial<{
    problem_statement: string
    starter_code?: string
    buggy_code?: string
    constraints_text?: string
  }>
  const update = (patch: Record<string, unknown>) => setContent({ ...content, ...patch })

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <Badge tone="rose">ویرایشگر {QUESTION_TYPE_LABELS[type]}</Badge>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="زبان برنامه‌نویسی">
          <input dir="ltr" className={`${inputClass} text-left font-mono`} value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="javascript / typescript / python / …" />
          <Hint>با Judge0 اجرا می‌شود؛ انگلیسی و lowercase بنویسید.</Hint>
        </Field>
        {type === 'coding' && (
          <Field label="کد شروع (starter code)">
            <textarea rows={3} dir="ltr" className={`${inputClass} text-left font-mono`} value={c.starter_code ?? ''} onChange={(e) => update({ starter_code: e.target.value })} placeholder="function solve(nums) {\n  // your code here\n}" />
            <Hint>اسکلت اولیه کدی که ادیتور کاربر با آن شروع می‌کند (اختیاری).</Hint>
          </Field>
        )}
      </div>

      {type === 'debugging' && (
        <Field label="کد خراب">
          <textarea rows={6} dir="ltr" className={`${inputClass} text-left font-mono`} value={c.buggy_code ?? ''} onChange={(e) => update({ buggy_code: e.target.value })} placeholder={'// این کد باگ دارد:\nfor (let i = 0; i <= arr.length; i++) {\n  sum += arr[i];\n}'} />
          <Hint>کدی که کاربر باید خطایش را پیدا و اصلاح کند.</Hint>
        </Field>
      )}

      <Field label="صورت مسئله">
        <textarea rows={5} className={inputClass} value={c.problem_statement ?? ''} onChange={(e) => update({ problem_statement: e.target.value })} placeholder="مثلاً: تابعی بنویسید که مجموع اعداد زوج آرایه را برگرداند." />
        <Hint>مسئله را کامل توضیح دهید: ورودی، خروجی مورد انتظار و رفتار در حالت خاص.</Hint>
      </Field>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-400">تست‌کیس‌ها <span className="text-zinc-600">(در ستون test_cases جدول question_versions ذخیره می‌شود)</span></p>
        <ul className="space-y-2">
          {testCases.map((row, i) => (
            <li key={i} className="flex items-center gap-2">
              <input dir="ltr" placeholder="ورودی — مثل [1,2,3,4]" className={`${inputClass} text-left font-mono`} value={row.input} onChange={(e) => setTestCases(testCases.map((r, j) => (j === i ? { ...r, input: e.target.value } : r)))} />
              <span className="shrink-0 text-zinc-600">←</span>
              <input dir="ltr" placeholder="خروجی مورد انتظار — مثل 6" className={`${inputClass} text-left font-mono`} value={row.expected} onChange={(e) => setTestCases(testCases.map((r, j) => (j === i ? { ...r, expected: e.target.value } : r)))} />
              <button type="button" onClick={() => setTestCases(testCases.filter((_, j) => j !== i))} className="shrink-0 text-xs text-rose-400/80 hover:text-rose-300">حذف</button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setTestCases([...testCases, { input: '', expected: '' }])} className="mt-2 text-xs text-signal-400 hover:text-signal-300">
          + افزودن تست‌کیس
        </button>
      </div>

      <Field label="محدودیت‌ها (اختیاری — هر خط یک مورد)">
        <textarea rows={3} className={inputClass} value={c.constraints_text ?? ''} onChange={(e) => update({ constraints_text: e.target.value })} placeholder={'مثلاً:\nطول آرایه ≤ 10^5\nزمان اجرا O(n)'} />
        <Hint>محدودیت زمان/حافظه/ورودی که پاسخ کاربر باید رعایت کند.</Hint>
      </Field>
    </div>
  )
}
