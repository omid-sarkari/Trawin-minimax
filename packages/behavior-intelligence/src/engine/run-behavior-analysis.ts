// Behavior Intelligence - Analysis Orchestrator
export async function runBehaviorAnalysis(adapter: any, codingSessionId: string): Promise<void> {
  const { editorEvents, codingEvents, clipboardMarkers, snapshots } = await adapter.fetchSessionEvents(codingSessionId);
  const ruleConfig = await adapter.loadActiveRuleConfig();
  const engineVersion = await adapter.loadActiveEngineVersion();
  const output = require('./run-engine').runEngine({
    sessionId: codingSessionId,
    editorEvents,
    codingEvents,
    clipboardMarkers,
    snapshots,
    ruleConfig,
    engineVersion
  });
  await adapter.persistResults(codingSessionId, output);
  console.log(`Behavior analysis completed for session: ${codingSessionId}`);
}