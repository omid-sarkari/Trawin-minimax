import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'
import { QUESTION_TYPES, type QuestionType } from '@/lib/admin/question-contracts'

interface ParsedItem {
  index: number
  valid: boolean
  errors: string[]
  payload: Record<string, unknown>
}

function validateItem(item: unknown, index: number, fallbackSkills: Record<string, number>): ParsedItem {
  const errors: string[] = []
  const it = (item ?? {}) as Record<string, unknown>

  const slug = String(it.slug ?? '').trim().toLowerCase()
  if (!/^[a-z0-9-]{3,}$/.test(slug)) errors.push('slug نامعتبر (حروف کوچک، رقم، خط تیره؛ حداقل ۳ کاراکتر)')

  const type = String(it.type ?? 'multiple_choice')
  if (!QUESTION_TYPES.includes(type as QuestionType)) errors.push(`نوع نامعتبر: ${type}`)

  const difficulty = Number(it.difficulty ?? 3)
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) errors.push('سختی باید ۱ تا ۵ باشد')

  const content = it.content
  if (type === 'multiple_choice') {
    const c = content as { options?: Array<{ is_correct?: boolean }> } | undefined
    if (!c?.options || !Array.isArray(c.options)) errors.push('content.options الزامی است')
    else if (!c.options.some((o) => o.is_correct)) errors.push('هیچ گزینه درستی علامت نخورده')
    else if (c.options.filter((o) => o.is_correct).length > 1) errors.push('بیش از یک گزینه درست علامت خورده')
  }
  if (typeof it.title !== 'string' || it.title.trim() === '') errors.push('عنوان الزامی است')

  const weights = { ...fallbackSkills }
  if (it.skill_weights && typeof it.skill_weights === 'object') Object.assign(weights, it.skill_weights)
  if (Object.keys(weights).length === 0) errors.push('هیچ مهارتی انتخاب نشده')

  return {
    index,
    valid: errors.length === 0,
    errors,
    payload: {
      slug,
      type,
      difficulty,
      title: it.title,
      description: it.description ?? null,
      language: it.language ?? null,
      content: content ?? {},
      test_cases: it.test_cases ?? null,
      skill_weights: weights,
      tag_ids: Array.isArray(it.tag_ids) ? it.tag_ids : [],
    },
  }
}

export async function POST(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const svc = createServiceClient()

    let raw: unknown[]
    try {
      raw = JSON.parse(String(body.json ?? ''))
    } catch {
      throw new Error('JSON نامعتبر است — ساختار را بررسی کنید.')
    }
    if (!Array.isArray(raw)) throw new Error('ورودی باید یک آرایه JSON باشد.')
    if (raw.length === 0) throw new Error('آرایه خالی است.')
    if (raw.length > 500) throw new Error('هر بار حداکثر ۵۰۰ سؤال وارد کنید.')

    const fallbackSkills: Record<string, number> = {}
    for (const [skillId, weight] of Object.entries(body.skill_weights ?? {})) {
      fallbackSkills[String(skillId)] = Number(weight)
    }

    const parsed = raw.map((item, i) => validateItem(item, i + 1, fallbackSkills))
    const invalid = parsed.filter((p) => !p.valid)

    if (!body.commit) {
      return {
        preview: true,
        total: parsed.length,
        invalidCount: invalid.length,
        rows: parsed.map(({ index, valid, errors }) => ({ index, valid, errors })),
      }
    }

    if (invalid.length > 0) {
      throw new Error(`${invalid.length} ردیف نامعتبر است — ابتدا آن‌ها را اصلاح کنید.`)
    }

    const { data, error } = await svc.rpc('admin_bulk_import_questions', {
      batch: parsed.map((p) => p.payload),
    })
    if (error) throw new Error(error.message)

    return { preview: false, result: data }
  })
}
