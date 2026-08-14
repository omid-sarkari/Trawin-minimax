import { BehaviorIntelligenceAdapter } from '../../types/adapter'
import { RawEditorEvent, RawCodingEvent, RawClipboardMarker, RawSnapshot } from '../../types/raw-events'
import { RuleConfig } from '../../types/rules'
import { EngineOutput } from '../../types/engine'

export class NextjsBehaviorIntelligenceAdapter implements BehaviorIntelligenceAdapter {
  constructor(private supabaseClient: any) {}
  async fetchSessionEvents(codingSessionId: string): Promise<{ editorEvents: RawEditorEvent[]; codingEvents: RawCodingEvent[]; clipboardMarkers: RawClipboardMarker[]; snapshots: RawSnapshot[] }> {
    return { editorEvents: [], codingEvents: [], clipboardMarkers: [], snapshots: [] }
  }
  async loadActiveRuleConfig(): Promise<RuleConfig[]> {
    return [
      { ruleId: 1, ruleName: 'high_paste_ratio', version: 1, condition: { detector: 'paste_ratio', operator: 'gte', value: 0.7 }, action: { weight: 0.3, flag: 'large_external_paste_ratio' } },
      { ruleId: 2, ruleName: 'burst_insertion', version: 1, condition: { detector: 'burst_insertion', operator: 'gte', value: 0.5 }, action: { weight: 0.25, flag: 'unnatural_insertion_speed' } },
      { ruleId: 3, ruleName: 'typing_rhythm_irregular', version: 1, condition: { detector: 'typing_rhythm', operator: 'gte', value: 0.8 }, action: { weight: 0.2, flag: 'irregular_typing_pattern' } },
      { ruleId: 4, ruleName: 'low_edit_locality', version: 1, condition: { detector: 'edit_locality', operator: 'gte', value: 0.7 }, action: { weight: 0.25, flag: 'scattered_edit_pattern' } }
    ]
  }
  async loadActiveEngineVersion(): Promise<string> { return 'bi-v1.0.0' }
  async persistResults(codingSessionId: string, output: EngineOutput): Promise<void> {
    console.log(`Persisting results for session ${codingSessionId}`)
  }
}
export function createNextjsAdapter(supabaseClient: any): NextjsBehaviorIntelligenceAdapter {
  return new NextjsBehaviorIntelligenceAdapter(supabaseClient)
}
export default NextjsBehaviorIntelligenceAdapter