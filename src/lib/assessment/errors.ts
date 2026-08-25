/**
 * Trawin Assessment Engine — canonical error model (spec §51).
 *
 * Every runtime failure maps to exactly one code so API routes can
 * translate it into a stable HTTP response without leaking internals.
 */

export const ASSESSMENT_ERROR_CODES = [
  'AUTHENTICATION_ERROR',
  'AUTHORIZATION_ERROR',
  'SESSION_NOT_FOUND',
  'SESSION_EXPIRED',
  'SESSION_ALREADY_SUBMITTED',
  'QUESTION_NOT_IN_SESSION',
  'INVALID_ANSWER',
  'VALIDATION_ERROR',
  'JUDGE0_UNAVAILABLE',
  'JUDGE0_TIMEOUT',
  'JUDGE0_RATE_LIMITED',
  'EXECUTION_ERROR',
  'EVALUATION_ERROR',
  'INTERNAL_ERROR',
] as const

export type AssessmentErrorCode = (typeof ASSESSMENT_ERROR_CODES)[number]

const HTTP_STATUS: Record<AssessmentErrorCode, number> = {
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  SESSION_NOT_FOUND: 404,
  SESSION_EXPIRED: 410,
  SESSION_ALREADY_SUBMITTED: 409,
  QUESTION_NOT_IN_SESSION: 403,
  INVALID_ANSWER: 400,
  VALIDATION_ERROR: 400,
  JUDGE0_UNAVAILABLE: 503,
  JUDGE0_TIMEOUT: 504,
  JUDGE0_RATE_LIMITED: 429,
  EXECUTION_ERROR: 500,
  EVALUATION_ERROR: 500,
  INTERNAL_ERROR: 500,
}

/** Persian-safe user messages; internals stay server-side. */
const USER_MESSAGES: Record<AssessmentErrorCode, string> = {
  AUTHENTICATION_ERROR: 'برای این عملیات باید وارد شوید.',
  AUTHORIZATION_ERROR: 'اجازه انجام این عملیات را ندارید.',
  SESSION_NOT_FOUND: 'جلسه آزمون پیدا نشد.',
  SESSION_EXPIRED: 'زمان این جلسه آزمون به پایان رسیده است.',
  SESSION_ALREADY_SUBMITTED: 'این آزمون قبلاً ثبت نهایی شده است.',
  QUESTION_NOT_IN_SESSION: 'این سؤال متعلق به جلسه فعلی شما نیست.',
  INVALID_ANSWER: 'پاسخ ارسالی معتبر نیست.',
  VALIDATION_ERROR: 'داده ارسالی معتبر نیست.',
  JUDGE0_UNAVAILABLE: 'سرویس اجرای کد در دسترس نیست؛ لطفاً بعداً دوباره تلاش کنید.',
  JUDGE0_TIMEOUT: 'اجرای کد بیش از حد طول کشید.',
  JUDGE0_RATE_LIMITED: 'تعداد درخواست‌های اجرای کد زیاد است؛ کمی صبر کنید.',
  EXECUTION_ERROR: 'خطا در پردازش اجرای کد.',
  EVALUATION_ERROR: 'خطا در فرایند ارزیابی؛ نتیجه بعداً نهایی می‌شود.',
  INTERNAL_ERROR: 'خطای غیرمنتظره سرور.',
}

export class AssessmentError extends Error {
  readonly code: AssessmentErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: AssessmentErrorCode, message?: string, details?: unknown) {
    super(message ?? USER_MESSAGES[code])
    this.name = 'AssessmentError'
    this.code = code
    this.status = HTTP_STATUS[code]
    this.details = details
  }

  /** Client-facing payload — never includes stack traces or secrets. */
  toResponse() {
    return Response.json(
      { error: this.message, code: this.code },
      { status: this.status },
    )
  }
}

/** Wraps any thrown error into an AssessmentError for uniform route handling. */
export function toAssessmentError(error: unknown): AssessmentError {
  if (error instanceof AssessmentError) return error
  return new AssessmentError('INTERNAL_ERROR')
}
