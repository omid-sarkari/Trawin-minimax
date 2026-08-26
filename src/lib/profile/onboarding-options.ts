/**
 * Data-driven onboarding option lists (p3.md §3).
 *
 * Stored as data (not scattered JSX logic) so new options require no code
 * changes; a future admin-managed table can replace these constants by
 * serving the same shape from the database.
 */

export interface IntentOption {
  key: string
  label: string
}

export const ONBOARDING_INTENTS: readonly IntentOption[] = [
  { key: 'find_job', label: 'پیدا کردن شغل' },
  { key: 'get_hired', label: 'استخدام توسط شرکت‌ها' },
  { key: 'evaluate_skills', label: 'سنجش مهارت‌های برنامه‌نویسی' },
  { key: 'improve_skills', label: 'بهبود مهارت‌ها' },
  { key: 'verified_resume', label: 'ساخت رزومه تأییدشده' },
  { key: 'competitions', label: 'شرکت در مسابقات' },
  { key: 'interview_prep', label: 'آمادگی مصاحبه فنی' },
  { key: 'learn_practice', label: 'یادگیری و تمرین' },
]

export const TARGET_ROLE_SUGGESTIONS: readonly string[] = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'React Developer',
  'Next.js Developer',
]

export const EXPERIENCE_LEVELS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'beginner', label: 'تازه‌کار', hint: 'کمتر از یک سال' },
  { key: 'junior', label: 'جونیور', hint: '۱ تا ۲ سال' },
  { key: 'mid', label: 'میدلول', hint: '۲ تا ۵ سال' },
  { key: 'senior', label: 'سنیور', hint: '۵ تا ۹ سال' },
  { key: 'expert', label: 'اکسپرت', hint: 'بیش از ۹ سال' },
]

export const WORK_PREFERENCES: readonly IntentOption[] = [
  { key: 'remote', label: 'دورکاری' },
  { key: 'onsite', label: 'حضوری' },
  { key: 'hybrid', label: 'هیبرید' },
  { key: 'freelance', label: 'فریلنس' },
  { key: 'full_time', label: 'تمام‌وقت' },
  { key: 'part_time', label: 'پاره‌وقت' },
  { key: 'internship', label: 'کارآموزی' },
]
