export const QUESTION_TYPES = [
  'multiple_choice',
  'fill_blank',
  'coding',
  'open_ended',
  'debugging',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'چهارگزینه‌ای',
  fill_blank: 'جای خالی',
  coding: 'برنامه‌نویسی',
  open_ended: 'تشریحی',
  debugging: 'دیباگ',
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'خیلی آسان',
  2: 'آسان',
  3: 'متوسط',
  4: 'سخت',
  5: 'خیلی سخت',
}

export const QUESTION_STATUSES = ['draft', 'published', 'archived'] as const
export type QuestionStatus = (typeof QUESTION_STATUSES)[number]

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشرشده',
  archived: 'بایگانی',
}

/** MCQ contract stored inside question_versions.content */
export interface McqContent {
  question: string
  options: Array<{ id: string; text: string; is_correct: boolean }>
  explanation?: string
}

export interface FillBlankContent {
  question_with_blank: string
  accepted_answers: string[]
  explanation?: string
}

export interface OpenEndedContent {
  prompt: string
  guidance?: string
}

export interface CodingContent {
  problem_statement: string
  starter_code?: string
  constraints?: string[]
  examples?: Array<{ input: string; output: string }>
}

export interface DebuggingContent extends CodingContent {
  buggy_code: string
}

export type QuestionVersionContent =
  | McqContent
  | FillBlankContent
  | OpenEndedContent
  | CodingContent
  | DebuggingContent

const OPTION_ID = /^[A-Za-z0-9]{1,3}$/

export function validateMcq(content: unknown): string | null {
  const c = content as Partial<McqContent>
  if (!c || typeof c.question !== 'string' || c.question.trim().length < 5)
    return 'متن سؤال حداقل ۵ کاراکتر باید باشد.'
  if (!Array.isArray(c.options) || c.options.length < 2) return 'حداقل دو گزینه لازم است.'
  const ids = new Set<string>()
  for (const opt of c.options) {
    if (!opt || typeof opt.text !== 'string' || opt.text.trim() === '') return 'متن همه گزینه‌ها الزامی است.'
    if (!OPTION_ID.test(opt.id ?? '')) return `شناسه گزینه نامعتبر است: ${opt.id}`
    if (ids.has(opt.id)) return `شناسه گزینه تکراری است: ${opt.id}`
    ids.add(opt.id)
  }
  const correctCount = c.options.filter((o) => o.is_correct).length
  if (correctCount === 0) return 'دقیقاً یک گزینه باید درست علامت بخورد.'
  if (correctCount > 1) return 'فقط یک گزینه می‌تواند درست باشد.'
  return null
}

export function validateFillBlank(content: unknown): string | null {
  const c = content as Partial<FillBlankContent>
  if (!c || typeof c.question_with_blank !== 'string' || !c.question_with_blank.includes('___'))
    return 'متن سؤال باید شامل جای خالی با سه زیرخط (___) باشد.'
  if (!Array.isArray(c.accepted_answers) || c.accepted_answers.filter((a) => a?.trim()).length === 0)
    return 'حداقل یک پاسخ قابل‌قبول وارد کنید.'
  return null
}

export function validateOpenEnded(content: unknown): string | null {
  const c = content as Partial<OpenEndedContent>
  if (!c || typeof c.prompt !== 'string' || c.prompt.trim().length < 10)
    return 'صورت سؤال تشریحی حداقل ۱۰ کاراکتر باید باشد.'
  return null
}

export function validateCodingLike(content: unknown): string | null {
  const c = content as Partial<DebuggingContent>
  if (!c || typeof c.problem_statement !== 'string' || c.problem_statement.trim().length < 10)
    return 'صورت مسئله حداقل ۱۰ کاراکتر باید باشد.'
  if ('buggy_code' in c && typeof c.buggy_code === 'string' && c.buggy_code.trim() === '')
    return 'کد خراب را وارد کنید.'
  return null
}

export function validateContentByType(type: QuestionType, content: unknown): string | null {
  switch (type) {
    case 'multiple_choice':
      return validateMcq(content)
    case 'fill_blank':
      return validateFillBlank(content)
    case 'open_ended':
      return validateOpenEnded(content)
    case 'coding':
    case 'debugging':
      return validateCodingLike(content)
    default:
      return 'نوع سؤال نامعتبر است.'
  }
}

export const BULK_IMPORT_EXAMPLE = `[
  {
    "slug": "js-async-001",
    "type": "multiple_choice",
    "difficulty": 2,
    "title": "خروجی Promise.all",
    "description": "رفتار Promise.all وقتی یکی از promise ها reject شود",
    "content": {
      "question": "اگر یکی از Promise های داخل Promise.all رد شود چه اتفاقی می‌افتد؟",
      "options": [
        { "id": "A", "text": "بقیه ادامه پیدا می‌کنند", "is_correct": false },
        { "id": "B", "text": "کل Promise فوراً reject می‌شود", "is_correct": true },
        { "id": "C", "text": "خطا نادیده گرفته می‌شود", "is_correct": false },
        { "id": "D", "text": "undefined برمی‌گردد", "is_correct": false }
      ],
      "explanation": "Promise.all با اولین reject کل زنجیره را fail می‌کند."
    }
  }
]`

export interface BulkItem {
  slug?: string
  type?: string
  difficulty?: number
  title?: string
  description?: string
  language?: string
  content?: unknown
  test_cases?: unknown
  skill_weights?: Record<string, number>
  tag_ids?: Array<string | number>
}
