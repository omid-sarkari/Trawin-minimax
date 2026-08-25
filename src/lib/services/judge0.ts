/**
 * Judge0 HTTP client + CodeExecutionProvider implementation (spec §22).
 *
 * SERVER-ONLY. Reads JUDGE0_URL / JUDGE0_AUTH_TOKEN from the server
 * environment (never NEXT_PUBLIC_*). Missing configuration fails closed:
 * every call degrades into `{ kind: 'provider', reason: 'unavailable' }`
 * so non-code assessment paths keep working (spec §55).
 *
 * This module never throws for operational failures and never logs
 * credentials, source code, or raw provider payloads.
 */

import {
  type CodeExecutionProvider,
  type NormalizedExecutionResult,
  type SingleRunRequest,
  type UserVerdict,
} from '@/lib/assessment/code-execution/provider'

// ---------------------------------------------------------------------------
// Configuration (fail-closed)
// ---------------------------------------------------------------------------

interface Judge0Config {
  baseUrl: string
  authToken?: string
}

function readConfig(): Judge0Config | null {
  const url = process.env.JUDGE0_URL?.trim()
  if (!url) return null
  try {
    // Validate URL shape early; an unusable URL is equivalent to no config.
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return {
      baseUrl: parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')),
      authToken: process.env.JUDGE0_AUTH_TOKEN?.trim() || undefined,
    }
  } catch {
    return null
  }
}

export function judge0ProviderConfigured(): boolean {
  return readConfig() !== null
}

// ---------------------------------------------------------------------------
// Language resolution
//
// Judge0 language IDs differ between deployments, so we resolve against the
// instance's own /languages list once per process and cache the mapping.
// ---------------------------------------------------------------------------

interface Judge0Language {
  id: number
  name: string
  slug?: string
}

const languageCache = new Map<string, Promise<Map<string, number>>>()

const LANGUAGE_MATCHERS: Record<string, RegExp> = {
  javascript: /javascript|node\.?js/i,
  typescript: /typescript/i,
  python: /python\s*3?(?!.*2)/i,
  java: /^java(?!\s?script)|^java$/i,
  csharp: /c#|csharp|\.net/i,
  cpp: /c\+\+|cpp/i,
  c: /\bc\b|\bgcc\b/i,
  go: /\bgo(lang)?\b/i,
  rust: /rust/i,
  php: /\bphp\b/i,
  ruby: /\bruby\b/i,
  kotlin: /kotlin/i,
  swift: /swift/i,
}

async function resolveLanguageId(config: Judge0Config, language: string): Promise<number | null> {
  const key = config.baseUrl
  let cached = languageCache.get(key)
  if (!cached) {
    cached = fetchLanguages(config.baseUrl, config.authToken)
    languageCache.set(key, cached)
    // A failed lookup should not be cached forever.
    void cached.catch(() => languageCache.delete(key))
  }
  const byName = await cached
  const wanted = language.trim().toLowerCase()
  const matcher = LANGUAGE_MATCHERS[wanted]
  if (!matcher) return null
  let best: number | null = null
  for (const [name, id] of byName) {
    if (matcher.test(name) && (best === null || id > best)) best = id
  }
  return best
}

async function fetchLanguages(baseUrl: string, token?: string): Promise<Map<string, number>> {
  const res = await fetch(`${baseUrl}/languages`, {
    headers: buildHeaders(token),
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`languages ${res.status}`)
  const list = (await res.json()) as Judge0Language[]
  const map = new Map<string, number>()
  for (const l of list) {
    map.set(l.slug ?? '', l.id)
    map.set(l.name, l.id)
  }
  return map
}

function buildHeaders(token?: string): Record<string, string> {
  // Self-hosted Judge0 CE authenticates via X-Auth-Token.
  return token ? { 'X-Auth-Token': token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

// ---------------------------------------------------------------------------
// Status normalization
// ---------------------------------------------------------------------------

/** Judge0 submission status ids (CE reference). */
const STATUS_ID_TO_VERDICT: Record<number, { verdict: UserVerdict } | null> = {
  1: null, // In Queue   (transient)
  2: null, // Processing (transient)
  3: { verdict: 'accepted' },
  4: { verdict: 'wrong_answer' },
  5: { verdict: 'time_limit_exceeded' },
  6: { verdict: 'compile_error' },
  7: { verdict: 'runtime_error' },
  8: { verdict: 'runtime_error' },
  9: { verdict: 'runtime_error' },
  10: { verdict: 'runtime_error' },
  11: { verdict: 'runtime_error' },
  12: { verdict: 'runtime_error' },
  13: null, // Internal Error → provider-side, handled separately
  14: { verdict: 'runtime_error' },
}

function isTerminal(statusId: number): boolean {
  return statusId >= 3
}

function decodeBase64(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return Buffer.from(value, 'base64').toString('utf8')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

interface Judge0RawSubmission {
  token: string
  status?: { id: number }
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
  time?: string | null
  memory?: number | null
}

const CREATE_RETRIES = 2
const POLL_BASE_DELAY_MS = 300
const POLL_MAX_DELAY_MS = 2_000
const POLL_DEADLINE_MS = 20_000

class ProviderHttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(`judge0 http ${status}`)
  }
}

async function judgeFetch(
  url: string,
  init: RequestInit & { headers: Record<string, string> },
): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt <= CREATE_RETRIES; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(10_000), cache: 'no-store' })
    } catch (error) {
      lastError = error
      if (attempt < CREATE_RETRIES) {
        await sleep(400 * 2 ** attempt)
      }
    }
  }
  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const judge0Provider: CodeExecutionProvider = {
  name: 'judge0',

  async runOnce(request: SingleRunRequest): Promise<NormalizedExecutionResult> {
    const empty: NormalizedExecutionResult = {
      stdout: '',
      stderr: '',
      compileOutput: '',
      timeMs: null,
      memoryKb: null,
      outcome: { kind: 'provider', reason: 'unavailable', retryable: true },
    }

    const config = readConfig()
    if (!config) return empty

    try {
      const languageId = await resolveLanguageId(config, request.language)
      if (languageId === null) {
        return { ...empty, outcome: { kind: 'provider', reason: 'invalid_language', retryable: false } }
      }

      // 1) Create submission (token-based; results fetched by polling).
      const created = await judgeFetch(
        `${config.baseUrl}/submissions?base64_encoded=true&wait=false`,
        {
          method: 'POST',
          headers: buildHeaders(config.authToken),
          body: JSON.stringify({
            language_id: languageId,
            source_code: Buffer.from(request.sourceCode, 'utf8').toString('base64'),
            stdin: request.stdin ? Buffer.from(request.stdin, 'utf8').toString('base64') : undefined,
            cpu_time_limit: request.cpuTimeLimitSec ?? 5,
            memory_limit: request.memoryLimitKb ?? 256_000,
          }),
        },
      )
      if (created.status === 401 || created.status === 403) {
        return { ...empty, outcome: { kind: 'provider', reason: 'unavailable', retryable: false } }
      }
      if (created.status === 429) {
        return { ...empty, outcome: { kind: 'provider', reason: 'rate_limited', retryable: true } }
      }
      if (!created.ok) {
        return { ...empty, outcome: { kind: 'provider', reason: 'internal_error', retryable: true } }
      }
      const { token } = (await created.json()) as { token?: string }
      if (!token) {
        return { ...empty, outcome: { kind: 'provider', reason: 'internal_error', retryable: true } }
      }

      // 2) Poll until terminal state or deadline.
      const deadline = Date.now() + POLL_DEADLINE_MS
      let delay = POLL_BASE_DELAY_MS
      while (Date.now() < deadline) {
        await sleep(delay)
        delay = Math.min(delay * 2, POLL_MAX_DELAY_MS)

        const polled = await fetch(
          `${config.baseUrl}/submissions/${encodeURIComponent(token)}?base64_encoded=true`,
          { headers: buildHeaders(config.authToken), signal: AbortSignal.timeout(10_000), cache: 'no-store' },
        ).catch(() => null)

        if (!polled) continue // transient network hiccup → keep polling until deadline
        if (polled.status === 429) {
          return { ...empty, outcome: { kind: 'provider', reason: 'rate_limited', retryable: true } }
        }
        if (!polled.ok) continue

        const raw = (await polled.json()) as Judge0RawSubmission
        const statusId = raw.status?.id ?? 0
        if (!isTerminal(statusId)) continue

        if (statusId === 13) {
          // Judge0 internal error → infrastructure, never the user's fault.
          return { ...empty, outcome: { kind: 'provider', reason: 'internal_error', retryable: true } }
        }

        // Unmapped terminal status → conservative user-side failure.
        const verdict: UserVerdict = STATUS_ID_TO_VERDICT[statusId]?.verdict ?? 'runtime_error'

        return {
          stdout: decodeBase64(raw.stdout),
          stderr: decodeBase64(raw.stderr),
          compileOutput: decodeBase64(raw.compile_output),
          timeMs: raw.time != null ? Math.round(Number(raw.time) * 1000) : null,
          memoryKb: raw.memory != null ? Number(raw.memory) : null,
          outcome: { kind: 'user', verdict },
        }
      }

      return { ...empty, outcome: { kind: 'provider', reason: 'timeout', retryable: true } }
    } catch {
      return { ...empty, outcome: { kind: 'provider', reason: 'unavailable', retryable: true } }
    }
  },
}
