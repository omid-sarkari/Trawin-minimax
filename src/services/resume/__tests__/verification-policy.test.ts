/**
 * Verification policy engine tests — the core "no easy badges" guarantee.
 * A skill is NEVER verified without substantial evidence.
 */

import { computeVerificationLevel } from '@/services/resume/living-resume.service'

const policy = {
  version: 1,
  verified: { min_graded_questions: 200, min_completed_exams: 5, min_projects: 3, min_score: 70 },
  emerging: { min_graded_questions: 30, min_completed_exams: 1, min_score: 50 },
  labels: {
    none: 'بدون شواهد کافی',
    emerging: 'در حال شکل‌گیری',
    verified: 'تأییدشده',
    expert: 'تأییدشده · پیشرفته',
  } as Record<string, string>,
}

describe('computeVerificationLevel', () => {
  it('one or two good exams NEVER verify a skill (the old bug)', () => {
    // High score, tiny evidence → at most "emerging", never verified.
    expect(computeVerificationLevel(100, 2, 2, 0, policy)).toBe('none')
    expect(computeVerificationLevel(95, 25, 3, 1, policy)).toBe('none')
    expect(computeVerificationLevel(90, 40, 4, 2, policy)).not.toBe('verified')
  })

  it('emerging requires the lower bar', () => {
    expect(computeVerificationLevel(60, 35, 2, 0, policy)).toBe('emerging')
  })

  it('below emerging score → none regardless of volume', () => {
    expect(computeVerificationLevel(30, 500, 10, 5, policy)).toBe('none')
  })

  it('verified needs ALL thresholds simultaneously', () => {
    expect(
      computeVerificationLevel(75, 210, 6, 3, policy),
    ).toBe('verified')

    // Missing projects alone blocks verification even with perfect scores.
    expect(
      computeVerificationLevel(90, 300, 8, 2, policy),
    ).toBe('emerging')
  })

  it('expert requires wide margins over verified', () => {
    expect(
      computeVerificationLevel(88, 450, 12, 6, policy),
    ).toBe('expert')
  })

  it('null score → none', () => {
    expect(computeVerificationLevel(null, 999, 9, 9, policy)).toBe('none')
  })
})
