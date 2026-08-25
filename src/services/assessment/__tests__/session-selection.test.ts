/**
 * Session state machine + question selection tests
 * (spec §53 items 9-15, 28).
 *
 * The strategies are exercised against a minimal thenable query-builder
 * fake — no DB, no network.
 */

import { canTransition, SESSION_TRANSITIONS } from '@/lib/assessment/types'
import {
  FixedSelectionStrategy,
  AdaptiveSelectionStrategy,
  getSelectionStrategy,
} from '@/services/assessment/question-selection.service'

describe('session state machine (spec §9)', () => {
  it('allows the forward flow', () => {
    expect(canTransition('started', 'submitted')).toBe(true)
    expect(canTransition('started', 'evaluating')).toBe(true)
    expect(canTransition('submitted', 'evaluating')).toBe(true)
    expect(canTransition('evaluating', 'completed')).toBe(true)
    expect(canTransition('started', 'cancelled')).toBe(true)
  })

  it('never resurrects terminal sessions', () => {
    for (const terminal of ['completed', 'cancelled'] as const) {
      expect(canTransition(terminal, 'started')).toBe(false)
      expect(canTransition(terminal, 'submitted')).toBe(false)
      expect(canTransition(terminal, 'evaluating')).toBe(false)
      expect(canTransition(terminal, 'completed')).toBe(false)
    }
    expect(canTransition('submitted', 'started')).toBe(false)
  })

  it('covers every declared state in the table', () => {
    expect(Object.keys(SESSION_TRANSITIONS).sort()).toEqual([
      'cancelled',
      'completed',
      'evaluating',
      'started',
      'submitted',
    ])
  })
})

// ---------------------------------------------------------------------------
// Minimal Supabase-like thenable fake
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>

interface TableSpec {
  rows?: Row[]
  single?: Row | null
}

function makeFakeDb(tables: Record<string, TableSpec>) {
  function builder(table: string) {
    const spec = tables[table] ?? {}
    const b = {
      select() {
        return b
      },
      eq() {
        return b
      },
      in() {
        return b
      },
      order() {
        return b
      },
      limit() {
        return b
      },
      async maybeSingle() {
        return { data: spec.single ?? null, error: null }
      },
      then(
        resolve: (v: { data: Row[]; error: null }) => void,
        _reject: unknown,
      ) {
        resolve({ data: [...(spec.rows ?? [])], error: null })
      },
    }
    return b
  }
  const db = { from: (table: string) => builder(table) }
  return db as never as Parameters<FixedSelectionStrategy['select']>[0]
}

describe('FixedSelectionStrategy', () => {
  it('pins latest versions of published exam questions in order', async () => {
    const db = makeFakeDb({
      exam_questions: {
        rows: [
          { question_id: 2, question_order: 2, weight: 3, questions: { id: 2, status: 'published' } },
          { question_id: 1, question_order: 1, weight: null, questions: { id: 1, status: 'published' } },
          { question_id: 9, question_order: 3, weight: null, questions: { id: 9, status: 'draft' } }, // filtered out
        ],
      },
      question_versions: {
        rows: [
          { id: 101, question_id: 1, version: 1 },
          { id: 102, question_id: 1, version: 2 }, // latest for q1
          { id: 201, question_id: 2, version: 1 },
        ],
      },
    })

    const selected = await new FixedSelectionStrategy().select(db, {
      examId: 7,
      targetCount: null,
      config: {},
    })

    expect(selected).toEqual([
      { questionId: 1, versionId: 102, order: 1, weight: 1, mode: 'fixed' },
      { questionId: 2, versionId: 201, order: 2, weight: 3, mode: 'fixed' },
    ])
  })

  it('returns empty set when the exam has no questions', async () => {
    const db = makeFakeDb({})
    const selected = await new FixedSelectionStrategy().select(db, {
      examId: 5,
      targetCount: null,
      config: {},
    })
    expect(selected).toEqual([])
  })

  it('respects target_question_count cap', async () => {
    const db = makeFakeDb({
      exam_questions: {
        rows: [
          { question_id: 1, question_order: 1, weight: null, questions: { id: 1, status: 'published' } },
          { question_id: 2, question_order: 2, weight: null, questions: { id: 2, status: 'published' } },
          { question_id: 3, question_order: 3, weight: null, questions: { id: 3, status: 'published' } },
        ],
      },
      question_versions: {
        rows: [
          { id: 11, question_id: 1, version: 1 },
          { id: 21, question_id: 2, version: 1 },
          { id: 31, question_id: 3, version: 1 },
        ],
      },
    })
    const selected = await new FixedSelectionStrategy().select(db, {
      examId: 1,
      targetCount: 2,
      config: {},
    })
    expect(selected).toHaveLength(2)
    expect(selected.map((s) => s.questionId)).toEqual([1, 2])
  })
})

describe('AdaptiveSelectionStrategy (MVP)', () => {
  it('is deterministic and empty on an empty pool', async () => {
    const db = makeFakeDb({ questions: { rows: [] } })
    const a = await new AdaptiveSelectionStrategy().select(db, { examId: 1, targetCount: 5, config: {} })
    const b = await new AdaptiveSelectionStrategy().select(db, { examId: 1, targetCount: 5, config: {} })
    expect(a).toEqual([])
    expect(b).toEqual([])
  })

  it('selects easy-first with pinned versions', async () => {
    const db = makeFakeDb({
      questions: {
        rows: [
          { id: 30, difficulty: 1 },
          { id: 10, difficulty: 4 },
        ],
      },
      question_versions: {
        rows: [
          { id: 301, question_id: 30, version: 1 },
          { id: 101, question_id: 10, version: 1 },
        ],
      },
    })
    const selected = await new AdaptiveSelectionStrategy().select(db, { examId: 2, targetCount: 2, config: {} })
    expect(selected[0].questionId).toBe(30) // easiest first
    expect(selected.every((s) => s.mode === 'adaptive')).toBe(true)
  })
})

describe('strategy registry', () => {
  it('maps modes correctly with fixed fallback', () => {
    expect(getSelectionStrategy('fixed').mode).toBe('fixed')
    expect(getSelectionStrategy('adaptive').mode).toBe('adaptive')
    expect(getSelectionStrategy(null).mode).toBe('fixed')
    expect(getSelectionStrategy(undefined).mode).toBe('fixed')
    expect(getSelectionStrategy('bogus').mode).toBe('fixed')
  })
})
