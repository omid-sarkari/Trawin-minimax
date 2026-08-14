import { RawEditorEvent, RawCodingEvent, RawClipboardMarker, RawSnapshot } from './raw-events'
import { RuleConfig } from './rules'
import { EngineOutput } from './engine'

export interface BehaviorIntelligenceAdapter {
  fetchSessionEvents(codingSessionId: string): Promise<{
    editorEvents: RawEditorEvent[]
    codingEvents: RawCodingEvent[]
    clipboardMarkers: RawClipboardMarker[]
    snapshots: RawSnapshot[]
  }>

  loadActiveRuleConfig(): Promise<RuleConfig[]>

  loadActiveEngineVersion(): Promise<string>

  persistResults(codingSessionId: string, output: EngineOutput): Promise<void>
}