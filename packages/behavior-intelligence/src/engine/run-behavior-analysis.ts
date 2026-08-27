import { BehaviorIntelligenceAdapter } from '../types/adapter'
import { EngineInput, EngineOutput } from '../types/engine'
import { runEngine } from './run-engine'

export async function runBehaviorAnalysis(
  adapter: BehaviorIntelligenceAdapter,
  codingSessionId: string
): Promise<void> {
  const { editorEvents, codingEvents, clipboardMarkers, snapshots } = await adapter.fetchSessionEvents(codingSessionId)
  const [ruleConfig, engineVersion] = await Promise.all([adapter.loadActiveRuleConfig(), adapter.loadActiveEngineVersion()])
  const input: EngineInput = { sessionId: codingSessionId, editorEvents, codingEvents, clipboardMarkers, snapshots, ruleConfig, engineVersion }
  const output: EngineOutput = await runEngine(input)
  await adapter.persistResults(codingSessionId, output)
}

export async function runBehaviorAnalysisWithInput(
  adapter: BehaviorIntelligenceAdapter,
  input: Partial<EngineInput> & { sessionId: string }
): Promise<EngineOutput> {
  const [ruleConfig, engineVersion] = await Promise.all([adapter.loadActiveRuleConfig(), adapter.loadActiveEngineVersion()])
  const fullInput: EngineInput = {
    sessionId: input.sessionId,
    editorEvents: input.editorEvents || [],
    codingEvents: input.codingEvents || [],
    clipboardMarkers: input.clipboardMarkers || [],
    snapshots: input.snapshots || [],
    ruleConfig: input.ruleConfig || ruleConfig,
    engineVersion: input.engineVersion || engineVersion
  }
  return runEngine(fullInput)
}

export default runBehaviorAnalysis