/**
 * Judge0 provider tests (spec §53 items 19-23).
 * Global fetch is mocked; no network access, no credentials needed.
 */

import { judge0Provider } from '@/lib/services/judge0'
import { outputsMatch } from '@/lib/assessment/code-execution/provider'

const ORIGINAL_ENV = { ...process.env }

function b64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function mockFetchOnce(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const impl = jest.fn(async (url: string | URL | Request, init?: RequestInit) =>
    handler(String(url), init),
  )
  global.fetch = impl as unknown as typeof fetch
  return impl
}

beforeEach(() => {
  process.env.JUDGE0_URL = 'https://judge0.test'
  process.env.JUDGE0_AUTH_TOKEN = 'secret-token'
})
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  jest.restoreAllMocks()
})

describe('fail-closed configuration (spec §55)', () => {
  it('reports unavailable when JUDGE0_URL is missing', async () => {
    delete process.env.JUDGE0_URL
    const result = await judge0Provider.runOnce({ sourceCode: 'x', language: 'javascript' })
    expect(result.outcome).toEqual({ kind: 'provider', reason: 'unavailable', retryable: true })
    expect(result.outcome.kind === 'user').toBe(false)
  })

  it('never throws when the provider is unreachable', async () => {
    mockFetchOnce(() => {
      throw new Error('ECONNREFUSED')
    })
    const result = await judge0Provider.runOnce({ sourceCode: 'x', language: 'javascript' })
    expect(result.outcome).toMatchObject({ kind: 'provider', reason: 'unavailable' })
  })
})

describe('execution outcome normalization', () => {
  function submissionFlow(statusId: number, stdout = '') {
    // Unique host per invocation → per-test language cache entry.
    process.env.JUDGE0_URL = `https://judge0-${Math.random().toString(36).slice(2)}.test`
    return mockFetchOnce((url) => {
      if (url.endsWith('/languages')) {
        return Response.json([
          { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
          { id: 94, name: 'TypeScript 3.9.7' },
        ])
      }
      if (url.includes('/submissions?')) {
        return Response.json({ token: 'tok-1' })
      }
      return Response.json({
        token: 'tok-1',
        status: { id: statusId },
        stdout: b64(stdout),
        stderr: b64(''),
        compile_output: b64(''),
        time: '0.01',
        memory: 1024,
      })
    })
  }

  it('maps accepted status to a user success', async () => {
    submissionFlow(3)
    const r = await judge0Provider.runOnce({ sourceCode: 'print(1)', language: 'javascript', expectedOutput: '' })
    expect(r.outcome).toEqual({ kind: 'user', verdict: 'accepted' })
    expect(r.stdout).toBe('')
    expect(r.timeMs).toBe(10)
  })

  it('maps compile errors as user failure — not provider issues', async () => {
    submissionFlow(6)
    const r = await judge0Provider.runOnce({ sourceCode: 'syntax error', language: 'javascript' })
    expect(r.outcome).toEqual({ kind: 'user', verdict: 'compile_error' })
  })

  it('maps runtime errors and timeouts as user failures', async () => {
    submissionFlow(11)
    expect(
      (await judge0Provider.runOnce({ sourceCode: 'x', language: 'javascript' })).outcome,
    ).toEqual({ kind: 'user', verdict: 'runtime_error' })

    submissionFlow(5)
    expect(
      (await judge0Provider.runOnce({ sourceCode: 'x', language: 'javascript' })).outcome,
    ).toEqual({ kind: 'user', verdict: 'time_limit_exceeded' })
  })

  it('maps Judge0 internal errors (13) to provider failure', async () => {
    submissionFlow(13)
    const r = await judge0Provider.runOnce({ sourceCode: 'x', language: 'javascript' })
    expect(r.outcome).toEqual({ kind: 'provider', reason: 'internal_error', retryable: true })
  })

  it('sends the auth token via header only and never leaks it in URLs', async () => {
    const impl = submissionFlow(3)
    await judge0Provider.runOnce({ sourceCode: 'print(1)', language: 'javascript' })
    for (const call of impl.mock.calls) {
      expect(String(call[0])).not.toContain('secret-token')
    }
    const createCall = impl.mock.calls.find((c) => String(c[0]).includes('/submissions?'))
    expect(createCall).toBeDefined()
    expect((createCall?.[1]?.headers as Record<string, string>)['X-Auth-Token']).toBe('secret-token')
  })
})

describe('outputsMatch', () => {
  it('is whitespace/CRLF tolerant', () => {
    expect(outputsMatch('a\r\nb\n', 'a\nb')).toBe(true)
    expect(outputsMatch('a ', 'a')).toBe(true)
    expect(outputsMatch('a', 'b')).toBe(false)
  })
})
