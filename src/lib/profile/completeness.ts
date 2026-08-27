/**
 * Resume completeness model (p3.md §18).
 *
 * Data-driven weighted checklist — no arbitrary percentages. Every rule
 * states what it checks and how much it contributes; the UI derives
 * human-readable "missing" items from the same rules.
 */

export interface CompletenessRule {
  key: string
  weight: number
  label: string
  /** Persian call-to-action shown when the rule is unmet. */
  missingHint: string
}

export const COMPLETENESS_RULES: readonly CompletenessRule[] = [
  { key: 'avatar', weight: 10, label: 'عکس پروفایل', missingHint: 'عکس پروفایل اضافه کن' },
  { key: 'headline', weight: 12, label: 'تیتر حرفه‌ای', missingHint: 'تیتر حرفه‌ای بنویس' },
  { key: 'bio', weight: 12, label: 'بیوگرافی', missingHint: 'بیوگرافی خود را کامل کن' },
  { key: 'username', weight: 8, label: 'نام کاربری عمومی', missingHint: 'نام کاربری عمومی انتخاب کن' },
  { key: 'primary_technology', weight: 10, label: 'تکنولوژی اصلی', missingHint: 'تکنولوژی اصلی‌ات را مشخص کن' },
  { key: 'work_preference', weight: 6, label: 'ترجیح کاری', missingHint: 'ترجیح کاری‌ات را ثبت کن' },
  { key: 'experience_years', weight: 6, label: 'سابقه کار', missingHint: 'سال تجربه‌ات را وارد کن' },
  { key: 'custom_section', weight: 12, label: 'حداقل یک بخش (پروژه/تجربه)', missingHint: 'یک پروژه یا سابقه کاری اضافه کن' },
  { key: 'first_assessment', weight: 16, label: 'اولین آزمون تکمیل‌شده', missingHint: 'اولین آزمون را کامل کن' },
  { key: 'verified_skill', weight: 8, label: 'مهارت تأییدشده', missingHint: 'با آزمون، مهارتت را تأیید کن' },
] as const

export interface CompletenessInput {
  avatarUrl?: string | null
  headline?: string | null
  bio?: string | null
  username?: string | null
  primaryTechnologyId?: number | null
  workPreference?: string[] | null
  experienceYears?: number | null
  hasCustomSection: boolean
  completedAssessments: number
  verifiedSkills: number
}

export interface CompletenessResult {
  percent: number
  met: string[]
  missing: Array<{ key: string; hint: string }>
}

function isFilled(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/** Deterministic, explainable scoring over the canonical rules. */
export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const totalWeight = COMPLETENESS_RULES.reduce((sum, r) => sum + r.weight, 0)
  const met: string[] = []
  const missing: Array<{ key: string; hint: string }> = []
  let earned = 0

  function check(rule: CompletenessRule, satisfied: boolean): void {
    if (satisfied) {
      earned += rule.weight
      met.push(rule.key)
    } else {
      missing.push({ key: rule.key, hint: rule.missingHint })
    }
  }

  for (const rule of COMPLETENESS_RULES) {
    switch (rule.key) {
      case 'avatar':
        check(rule, isFilled(input.avatarUrl))
        break
      case 'headline':
        check(rule, isFilled(input.headline))
        break
      case 'bio':
        check(rule, isFilled(input.bio) && input.bio!.trim().length >= 40)
        break
      case 'username':
        check(rule, isFilled(input.username))
        break
      case 'primary_technology':
        check(rule, typeof input.primaryTechnologyId === 'number')
        break
      case 'work_preference':
        check(rule, Array.isArray(input.workPreference) && input.workPreference.length > 0)
        break
      case 'experience_years':
        check(rule, typeof input.experienceYears === 'number' && input.experienceYears > 0)
        break
      case 'custom_section':
        check(rule, input.hasCustomSection)
        break
      case 'first_assessment':
        check(rule, input.completedAssessments >= 1)
        break
      case 'verified_skill':
        check(rule, input.verifiedSkills >= 1)
        break
    }
  }

  return {
    percent: Math.round((earned / totalWeight) * 100),
    met,
    missing,
  }
}
