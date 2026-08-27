/**
 * Evaluation engine unit tests (spec §53 items 16-17).
 * Pure logic — no DB access.
 */

import {
  mcqIsCorrect,
  fillBlankIsCorrect,
  normalizeText,
} from '@/services/assessment/evaluation.service'

describe('normalizeText', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeText('  Hello   World ')).toBe('hello world')
  })

  it('normalizes Persian/Arabic letter variants', () => {
    expect(normalizeText('يك')).toBe(normalizeText('یک'))
    expect(normalizeText('كتاب')).toBe(normalizeText('کتاب'))
    expect(normalizeText('آبادان')).toBe(normalizeText('ابادان'))
  })

  it('converts Persian and Arabic digits to Latin', () => {
    expect(normalizeText('۱۲۳')).toBe('123')
    expect(normalizeText('٤٥')).toBe('45')
  })
})

describe('mcqIsCorrect', () => {
  const content = {
    options: [
      { id: 'A', text: 'x', is_correct: false },
      { id: 'B', text: 'y', is_correct: true },
    ],
  }

  it('accepts the correct option case-insensitively', () => {
    expect(mcqIsCorrect(content, 'b')).toBe(true)
    expect(mcqIsCorrect(content, 'B')).toBe(true)
  })

  it('rejects wrong options', () => {
    expect(mcqIsCorrect(content, 'A')).toBe(false)
  })

  it('returns null when content has no marked correct option', () => {
    expect(mcqIsCorrect({ options: [{ id: 'A', is_correct: false }] }, 'A')).toBeNull()
    expect(mcqIsCorrect(null, 'A')).toBeNull()
  })
})

describe('fillBlankIsCorrect', () => {
  const content = { accepted_answers: ['Promise.all', 'promise all'] }

  it('matches any accepted answer after normalization', () => {
    expect(fillBlankIsCorrect(content, 'PROMISE ALL')).toBe(true)
    expect(fillBlankIsCorrect(content, 'promise.all')).toBe(true)
    expect(fillBlankIsCorrect(content, '  promise   all ')).toBe(true)
    expect(fillBlankIsCorrect(content, '۱۲۳')).toBe(false)
  })

  it('rejects non-accepted answers', () => {
    expect(fillBlankIsCorrect(content, 'Promise.race')).toBe(false)
  })

  it('returns null without accepted answers contract', () => {
    expect(fillBlankIsCorrect({}, 'x')).toBeNull()
  })
})
