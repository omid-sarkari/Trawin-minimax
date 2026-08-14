// Behavior Intelligence - Adapter Interface
export interface BehaviorIntelligenceAdapter {
  fetchSessionEvents(codingSessionId: string): Promise<{
    editorEvents: any[];
    codingEvents: any[];
    clipboardMarkers: any[];
    snapshots: any[];
  }>;
  loadActiveRuleConfig(): Promise<any[]>;
  loadActiveEngineVersion(): Promise<string>;
  persistResults(codingSessionId: string, output: any): Promise<void>;
}