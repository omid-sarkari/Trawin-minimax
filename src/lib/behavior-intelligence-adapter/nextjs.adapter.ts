// Next.js Adapter for Behavior Intelligence
export class NextjsBehaviorIntelligenceAdapter {
  constructor(private supabase: any) {}
  
  async fetchSessionEvents(codingSessionId: string) {
    const [editorEvents, codingEvents, clipboardMarkers, snapshots] = await Promise.all([
      this.supabase.from('editor_events').select('*').eq('session_id', codingSessionId).order('created_at', { ascending: true }),
      this.supabase.from('coding_events').select('*').eq('coding_session_id', codingSessionId).order('created_at', { ascending: true }),
      this.supabase.from('clipboard_markers').select('*').eq('coding_session_id', codingSessionId).order('created_at', { ascending: true }),
      this.supabase.from('coding_snapshots').select('*').eq('coding_session_id', codingSessionId).order('created_at', { ascending: true })
    ]);
    return {
      editorEvents: editorEvents.data || [],
      codingEvents: codingEvents.data || [],
      clipboardMarkers: clipboardMarkers.data || [],
      snapshots: snapshots.data || []
    };
  }
  
  async loadActiveRuleConfig() {
    const { data: activeRules } = await this.supabase.from('evaluation_rules').select('id, name').eq('active', true);
    const ruleConfigs: any[] = [];
    for (const rule of (activeRules || [])) {
      const { data: versions } = await this.supabase.from('rule_versions')
        .select('version, conditions, actions').eq('rule_id', rule.id).order('version', { ascending: false }).limit(1);
      if (versions && versions.length > 0) {
        ruleConfigs.push({
          ruleId: rule.id,
          ruleName: rule.name,
          version: versions[0].version,
          condition: versions[0].conditions,
          action: versions[0].actions
        });
      }
    }
    return ruleConfigs;
  }
  
  async loadActiveEngineVersion() {
    const { data } = await this.supabase.from('engine_versions').select('version').eq('active', true).limit(1);
    return data && data.length > 0 ? data[0].version : 'unknown';
  }
  
  async persistResults(codingSessionId: string, output: any) {
    const now = new Date().toISOString();
    for (const result of output.detectorResults) {
      await this.supabase.from('ai_detection_results').insert({
        coding_session_id: codingSessionId,
        detection_type: result.detectionType,
        probability: result.probability,
        result: result.result,
        created_at: now
      });
    }
    await this.supabase.from('coding_sessions').update({
      behavior_state: output.behaviorState,
      behavior_intelligence_version: output.engineVersion,
      last_behavior_flush_at: now
    }).eq('id', codingSessionId);
  }
}