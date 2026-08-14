import { RawEditorEvent, RawCodingEvent, RawClipboardMarker, RawSnapshot } from './raw-events'
import { RuleConfig } from './rules'
import { DetectorResult } from './detector'

export interface EngineInput {
  sessionId: string
  editorEvents: RawEditorEvent[]
  codingEvents: RawCodingEvent[]
  clipboardMarkers: RawClipboardMarker[]
  snapshots: RawSnapshot[]
  ruleConfig: RuleConfig[]
  engineVersion: string
}

export interface BehaviorState {
  ensembleScore: number
  flags: string[]
  requiresHumanReview: boolean
  detectors: Record<string, { score: number; weight: number }>
}

export interface EngineOutput {
  engineVersion: string
  computedAt: string
  detectorResults: DetectorResult[]
  behaviorState: BehaviorState
}