/**
 * Question delivery sanitization tests (spec §53 item 24 — hidden test
 * protection, §16 — no correct answers to the client).
 */

import {
  sanitizeQuestionForClient,
  extractPublicTestCases,
} from '@/services/assessment/question-delivery.service'

function version(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    question_id: 10,
    question_id_fk: undefined,
    title: 'عنوان',
    description: null,
    language: null,
    test_cases: null,
    created_at: null,
    version: 1,
    content: {},
    ...overrides,
  }
}

describe('sanitizeQuestionForClient — multiple_choice', () => {
  it('strips is_correct flags from options', () => {
    const q = sanitizeQuestionForClient('multiple_choice', 2, 1, 1, version({
      content: {
        question: 'متن؟',
        options: [
          { id: 'A', text: 'درست', is_correct: true },
          { id: 'B', text: 'غلط', is_correct: false },
        ],
      },
    }))
    expect(q.options).toEqual([
      { id: 'A', text: 'درست' },
      { id: 'B', text: 'غلط' },
    ])
    const serialized = JSON.stringify(q)
    expect(serialized).not.toContain('is_correct')
  })
})

describe('sanitizeQuestionForClient — coding legacy + wizard contracts', () => {
  it('supports the legacy seeded shape', () => {
    const q = sanitizeQuestionForClient('coding', 3, 2, 1, version({
      language: 'javascript',
      content: {
        language: 'javascript',
        question: 'تابع را کامل کن.',
        starter_code: 'function f(){}',
        expected_behavior: 'خروجی درست',
      },
    }))
    expect(q.body).toBe('تابع را کامل کن.')
    expect(q.starterCode).toBe('function f(){}')
    expect(q.language).toBe('javascript')
  })

  it('supports the wizard shape and keeps hidden data server-side', () => {
    const q = sanitizeQuestionForClient('coding', 3, 2, 1, version({
      content: {
        problem_statement: 'مسئله',
        starter_code: '// start',
        constraints: ['O(n)'],
        examples: [{ input: '1', output: '2' }],
      },
      test_cases: [
        { name: 'pub', input: '1', expected_output: '2', hidden: false },
        { name: 'secret', input: '9', expected_output: '18', hidden: true },
      ],
    }))
    expect(q.body).toBe('مسئله')
    expect(JSON.stringify(q)).not.toContain('secret')
    expect(JSON.stringify(q)).not.toContain('"18"')
  })
})

describe('sanitizeQuestionForClient — fill_blank contracts', () => {
  it('supports BOTH wizard and legacy seeded shapes', () => {
    const wizard = sanitizeQuestionForClient('fill_blank', 1, 1, 1, version({
      content: {
        question_with_blank: 'با ___ مقدار پیش‌فرض بده.',
        accepted_answers: ['='],
      },
    }))
    expect(wizard.body).toBe('با ___ مقدار پیش‌فرض بده.')

    const legacy = sanitizeQuestionForClient('fill_blank', 1, 2, 1, version({
      content: {
        question: 'کلمه کلیدی ____ برای بازگشت نتیجه.',
        accepted_answers: ['return'],
        answer: 'return', // legacy correct-answer field
      },
    }))
    expect(legacy.body).toBe('کلمه کلیدی ____ برای بازگشت نتیجه.')
    // Legacy correct answers must never reach the client.
    const serialized = JSON.stringify(legacy)
    expect(serialized).not.toContain('"answer"')
    expect(serialized).not.toContain('accepted_answers')
  })
})

describe('extractPublicTestCases', () => {
  it('drops hidden and malformed entries', () => {
    const pub = extractPublicTestCases([
      { name: 'a', input: '1', expected_output: '1', hidden: false },
      { name: 'b', input: '2', expected_output: '2', hidden: true },
      'garbage',
      null,
    ])
    expect(pub).toEqual([{ name: 'a', input: '1', expected_output: '1' }])
  })

  it('returns empty for non-array payloads (jsonb null)', () => {
    expect(extractPublicTestCases(null)).toEqual([])
    expect(extractPublicTestCases(undefined)).toEqual([])
  })
})
