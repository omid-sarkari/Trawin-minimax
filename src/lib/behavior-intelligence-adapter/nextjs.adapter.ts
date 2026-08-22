import type { SupabaseClient } from '@supabase/supabase-js'
import {
  BehaviorIntelligenceAdapter,
  RawEditorEvent,
  RawCodingEvent,
  RawClipboardMarker,
  RawSnapshot,
  RuleConfig,
  EngineOutput
} from 'behavior-intelligence'
import {
  mapEditorEventRow,
  mapCodingEventRow,
  mapClipboardMarkerRow,
  mapSnapshotRow
} from './map-rows'

type QueryResult = { error: { message: string } | null }

function assertOk(result: QueryResult, table: string): void {
  if (result.error) throw new Error(`[BI Adapter] ${table}: ${result.error.message}`)
}

export class NextjsBehaviorIntelligenceAdapter implements BehaviorIntelligenceAdapter {
  constructor(private supabase: SupabaseClient) {}

  async fetchSessionEvents(codingSessionId: string): Promise<{
    editorEvents: RawEditorEvent[]
    codingEvents: RawCodingEvent[]
    clipboardMarkers: RawClipboardMarker[]
    snapshots: RawSnapshot[]
  }> {
    const [editorEvents, codingEvents, clipboardMarkers, snapshots] = await Promise.all([
      this.supabase.from('editor_events').select('*').eq('session_id', codingSessionId).order('created_at', { ascending: true }),
      this.supabase.from('coding_events').select('*').eq('coding_session_id', codingSessionId).order('created_at', { ascending: true }),
      this.supabase.from('clipboard_markers').select('*').eq('coding_session_id', codingSessionId).order('created_at', { ascending: true }),
      this.supabase.from('coding_snapshots').select('*').eq('coding_session_id', codingSessionId).order('created_at', { ascending: true })
    ])

    assertOk(editorEvents, 'editor_events')
    assertOk(codingEvents, 'coding_events')
    assertOk(clipboardMarkers, 'clipboard_markers')
    assertOk(snapshots, 'coding_snapshots')

    return {
      editorEvents: (editorEvents.data ?? []).map((row) => mapEditorEventRow(row as Record<string, unknown>)),
      codingEvents: (codingEvents.data ?? []).map((row) => mapCodingEventRow(row as Record<string, unknown>)),
      clipboardMarkers: (clipboardMarkers.data ?? []).map((row) => mapClipboardMarkerRow(row as Record<string, unknown>)),
      snapshots: (snapshots.data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>))
    }
  }

  async loadActiveRuleConfig(): Promise<RuleConfig[]> {
    const { data: activeRules, error } = await this.supabase
      .from('evaluation_rules')
      .select('id, name')
      .eq('active', true)
    if (error) throw new Error(`[BI Adapter] evaluation_rules: ${error.message}`)

    const rules = activeRules ?? []
    if (rules.length === 0) return []

    const ruleIds = rules.map((r) => r.id)
    const { data: versions, error: versionsError } = await this.supabase
      .from('rule_versions')
      .select('rule_id, version, conditions, actions')
      .in('rule_id', ruleIds)
      .order('version', { ascending: false })
    if (versionsError) throw new Error(`[BI Adapter] rule_versions: ${versionsError.message}`)

    const latestByRule = new Map<number, { version: number; conditions: unknown; actions: unknown }>()
    for (const row of versions ?? []) {
      if (!latestByRule.has(row.rule_id)) latestByRule.set(row.rule_id, row)
    }

    return rules.flatMap((rule) => {
      const latest = latestByRule.get(rule.id)
      if (!latest) return []
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        version: latest.version,
        condition: latest.conditions as RuleConfig['condition'],
        action: latest.actions as RuleConfig['action']
      }]
    })
  }

  async loadActiveEngineVersion(): Promise<string> {
    const { data, error } = await this.supabase
      .from('engine_versions')
      .select('version')
      .eq('active', true)
      .limit(1)
    if (error) throw new Error(`[BI Adapter] engine_versions: ${error.message}`)
    return data && data.length > 0 ? data[0].version : 'unknown'
  }

  async persistResults(codingSessionId: string, output: EngineOutput): Promise<void> {
    const now = new Date().toISOString()

    if (output.detectorResults.length > 0) {
      const { error } = await this.supabase.from('ai_detection_results').insert(
        output.detectorResults.map((result) => ({
          coding_session_id: codingSessionId,
          detection_type: result.detectionType,
          probability: result.probability,
          result: result.result,
          created_at: now
        }))
      )
      if (error) throw new Error(`[BI Adapter] ai_detection_results: ${error.message}`)
    }

    const { error } = await this.supabase
      .from('coding_sessions')
      .update({
        behavior_state: output.behaviorState,
        behavior_intelligence_version: output.engineVersion,
        last_behavior_flush_at: now
      })
      .eq('id', codingSessionId)
    if (error) throw new Error(`[BI Adapter] coding_sessions: ${error.message}`)
  }
}

export function createNextjsAdapter(supabase: SupabaseClient): NextjsBehaviorIntelligenceAdapter {
  return new NextjsBehaviorIntelligenceAdapter(supabase)
}

export default NextjsBehaviorIntelligenceAdapter
