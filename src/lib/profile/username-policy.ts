/**
 * Centralized username policy (p3.md §15).
 *
 * Single source of truth for validation + reserved names. The database
 * enforces uniqueness (users_username_key + case-insensitive
 * users_username_lower_key); this module enforces shape/reserved rules
 * server-side before any write.
 */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 24

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/

/**
 * Reserved/system names — never claimable. Extend freely; the list is
 * centralized here on purpose (§15: do not assume completeness elsewhere).
 */
const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin', 'administrator', 'api', 'app', 'auth', 'login', 'logout',
  'register', 'signup', 'signin', 'dashboard', 'settings', 'account',
  'support', 'help', 'company', 'companies', 'developer', 'developers',
  'resume', 'resumes', 'profile', 'profiles', 'exam', 'exams', 'assessment',
  'assessments', 'onboarding', 'admin-panel', 'root', 'system', 'trawin',
  'www', 'mail', 'email', 'null', 'undefined', 'about', 'terms', 'privacy',
])

export interface UsernameValidation {
  ok: boolean
  /** Normalized (lowercased) form to persist, when valid. */
  normalized?: string
  reason?: string
}

/** Normalizes any input to the canonical stored form (lowercase). */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}

export function validateUsername(input: string): UsernameValidation {
  const username = normalizeUsername(input)

  if (username.length < USERNAME_MIN) {
    return { ok: false, reason: `نام کاربری حداقل ${USERNAME_MIN} کاراکتر باشد.` }
  }
  if (username.length > USERNAME_MAX) {
    return { ok: false, reason: `نام کاربری حداکثر ${USERNAME_MAX} کاراکتر باشد.` }
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      reason: 'فقط حروف انگلیسی کوچک، عدد، نقطه، خط تیره و زیرخط مجاز است و باید با حرف/عدد شروع و تمام شود.',
    }
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { ok: false, reason: 'این نام کاربری رزرو شده است.' }
  }
  return { ok: true, normalized: username }
}
