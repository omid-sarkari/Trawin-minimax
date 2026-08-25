/**
 * Question Delivery (spec §16, §27).
 *
 * Converts a stored question + pinned version row into the sanitized
 * payload the browser may receive. Correct answers, accepted answers and
 * hidden test cases NEVER cross this boundary.
 */

import type { ClientQuestion, PublicTestCase, QuestionType } from '@/lib/assessment/types'

/** Structural subset of a version row required for sanitized delivery. */
export interface VersionDeliveryRow {
  question_id: number
  title: string
  content: unknown
  language: string | null
}

interface McqContent {
  question?: string
  options?: Array<{ id: string; text: string; is_correct: boolean }>
  explanation?: string
}

interface FillBlankContent {
  question_with_blank?: string
  accepted_answers?: string[]
  explanation?: string
}

/** Legacy seeded shape (pre-wizard) still present in the live data. */
interface LegacyCodingContent {
  language?: string
  question?: string
  starter_code?: string
  expected_behavior?: string
}

interface WizardCodingContent {
  problem_statement?: string
  starter_code?: string
  constraints?: string[]
  examples?: Array<{ input: string; output: string }>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/**
 * Splits stored test cases into the public subset. The storage contract is
 * an array of `{ name, input, expected_output, hidden? }`; anything marked
 * `hidden: true` (or malformed) stays server-side.
 */
export function extractPublicTestCases(testCases: unknown): PublicTestCase[] {
  if (!Array.isArray(testCases)) return []
  const out: PublicTestCase[] = []
  for (const raw of testCases) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const tc = raw as Record<string, unknown>
    if (tc.hidden === true) continue
    if (typeof tc.input !== 'string' || typeof tc.expected_output !== 'string') continue
    const name = typeof tc.name === 'string' ? tc.name : `case-${out.length + 1}`
    out.push({
      name,
      input: tc.input,
      expected_output: tc.expected_output,
    })
  }
  return out
}

export function sanitizeQuestionForClient(
  type: QuestionType,
  difficulty: number | null,
  order: number,
  weight: number,
  version: VersionDeliveryRow,
): ClientQuestion {
  const content = asRecord(version.content)

  const base: ClientQuestion = {
    id: version.question_id,
    order,
    weight,
    type,
    title: version.title,
    difficulty,
    language: version.language,
    body: '',
    examples: [],
    constraints: [],
  }

  switch (type) {
    case 'multiple_choice': {
      const c = content as unknown as McqContent
      base.body = c.question ?? ''
      base.options = (c.options ?? []).map((o) => ({ id: o.id, text: o.text }))
      break
    }
    case 'fill_blank': {
      const c = content as unknown as FillBlankContent
      base.body = c.question_with_blank ?? ''
      // accepted_answers intentionally omitted.
      break
    }
    case 'open_ended': {
      base.body = String(content.prompt ?? content.question ?? '')
      break
    }
    case 'coding':
    case 'debugging': {
      // Support both the legacy seeded contract and the wizard contract.
      const legacy = content as unknown as LegacyCodingContent
      const wizard = content as unknown as WizardCodingContent
      base.body =
        wizard.problem_statement ??
        legacy.question ??
        legacy.expected_behavior ??
        ''
      base.starterCode =
        (typeof content.starter_code === 'string' && content.starter_code) ||
        legacy.starter_code ||
        undefined
      base.buggyCode =
        typeof content.buggy_code === 'string' ? content.buggy_code : undefined
      base.examples = Array.isArray(wizard.examples) ? wizard.examples : []
      base.constraints = Array.isArray(wizard.constraints)
        ? wizard.constraints.filter((x): x is string => typeof x === 'string')
        : []
      if (!base.language && legacy.language) base.language = legacy.language
      // test_cases stay server-side entirely for coding questions.
      break
    }
  }

  return base
}
