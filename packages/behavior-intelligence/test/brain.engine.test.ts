import { BrainEngine } from '../src/brain'
import { TEST_BRAIN_CONFIG } from '../src/brain/config'
import { RawEditorEvent, RawClipboardMarker } from '../src/types/raw-events'

const editorEvent = (id: number, text: string): RawEditorEvent => ({
  id,
  sessionId: 'session-1',
  eventType: 'insert',
  payload: { text },
  createdAt: new Date(2026, 0, 1, 10, 0, id).toISOString()
})

const clipboardMarker = (id: number, contentLength: number): RawClipboardMarker => ({
  id,
  codingSessionId: 'session-1',
  markerType: 'paste',
  markerHash: `hash-${id}`,
  isInternal: false,
  metadata: { contentLength },
  createdAt: new Date(2026, 0, 1, 10, 5, id).toISOString()
})

describe('BrainEngine', () => {
  it('passes raw session events to detectors', async () => {
    const engine = new BrainEngine(TEST_BRAIN_CONFIG)
    const { brainOutput } = await engine.process({
      sessionId: 'session-1',
      editorEvents: [editorEvent(1, 'function hello() {'), editorEvent(2, ' return 42 }')],
      codingEvents: [],
      clipboardMarkers: [clipboardMarker(1, 200), clipboardMarker(2, 150)],
      snapshots: [],
      ruleConfig: [{ ruleId: 1, ruleName: 'high_paste_ratio', version: 1, condition: { detector: 'paste_ratio', operator: 'gte', value: 0.7 }, action: { weight: 0.3, flag: 'large_external_paste_ratio' } }],
      engineVersion: 'bi-test'
    })

    const pasteRatio = brainOutput.detectorResults.find((r) => r.detectionType === 'paste_ratio')
    expect(pasteRatio).toBeDefined()
    expect(pasteRatio?.probability).toBeGreaterThan(0.5)
    expect(brainOutput.behaviorState.flags).toContain('large_external_paste_ratio')
  })

  it('returns zero probability when no events are provided', async () => {
    const engine = new BrainEngine(TEST_BRAIN_CONFIG)
    const { brainOutput } = await engine.process({
      sessionId: 'session-1',
      editorEvents: [],
      codingEvents: [],
      clipboardMarkers: [],
      snapshots: [],
      ruleConfig: [],
      engineVersion: 'bi-test'
    })

    const pasteRatio = brainOutput.detectorResults.find((r) => r.detectionType === 'paste_ratio')
    expect(pasteRatio?.probability).toBe(0)
    expect(brainOutput.behaviorState.ensembleScore).toBe(0)
  })
})
