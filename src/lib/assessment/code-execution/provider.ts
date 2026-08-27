/**
 * Code Execution Provider boundary (spec §20).
 *
 * The assessment engine depends ONLY on this interface — never on Judge0
 * HTTP details. A future provider swap must not touch the runtime.
 *
 * Critical distinction (spec §24):
 *   - `user` outcome  → the submitted code itself failed (compile/runtime/
 *     wrong answer/timeout). Grading-relevant.
 *   - `provider` failure → the execution infrastructure failed. NEVER
 *     counts against the user's answer.
 */

export type UserVerdict =
  | 'accepted'
  | 'wrong_answer'
  | 'compile_error'
  | 'runtime_error'
  | 'time_limit_exceeded'

export type ProviderFailureReason =
  | 'unavailable'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_language'
  | 'internal_error'

export type ExecutionOutcome =
  | {
      kind: 'user'
      verdict: UserVerdict
      /** Which test produced the verdict (index into the batch), when known. */
      failedTestIndex?: number
    }
  | { kind: 'provider'; reason: ProviderFailureReason; retryable: boolean }

export interface NormalizedExecutionResult {
  stdout: string
  stderr: string
  compileOutput: string
  timeMs: number | null
  memoryKb: number | null
  outcome: ExecutionOutcome
}

export interface SingleRunRequest {
  sourceCode: string
  language: string
  stdin?: string
  expectedOutput?: string
  cpuTimeLimitSec?: number
  memoryLimitKb?: number
}

export interface CodeExecutionProvider {
  readonly name: string
  /**
   * Runs one program once and normalizes the raw provider response.
   * Must never throw for expected operational failures — those are
   * expressed as `{ kind: 'provider' }` outcomes.
   */
  runOnce(request: SingleRunRequest): Promise<NormalizedExecutionResult>
}

/** Compares trimmed, newline-normalized output. */
export function outputsMatch(actual: string, expected: string): boolean {
  const norm = (s: string) => s.replace(/\r\n/g, '\n').trim()
  return norm(actual) === norm(expected)
}
