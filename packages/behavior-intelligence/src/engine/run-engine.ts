import { EngineInput, EngineOutput, BehaviorState } from '../types/engine'
import { RuleConfig } from '../types/rules'
import { DetectorResult } from '../types/detector'
import { runAllDetectors } from '../detectors'
import { DetectorInput } from '../types/detector'

export async function runEngine(input: EngineInput): Promise<EngineOutput> {
  const startTime = new Date().toISOString()
  const detectorInput: DetectorInput = {
    sessionId: input.sessionId,
    editorEvents: input.editorEvents,
    codingEvents: input.codingEvents,
    clipboardMarkers: input.clipboardMarkers,
    snapshots: input.snapshots
  }
  const detectorResults = await runAllDetectors(detectorInput)
  const { behaviorState } = aggregateResults(detectorResults, input.ruleConfig)
  return {
    engineVersion: input.engineVersion,
    computedAt: startTime,
    detectorResults,
    behaviorState
  }
}

function aggregateResults(detectorResults: DetectorResult[], ruleConfigs: RuleConfig[]): { behaviorState: BehaviorState } {
  const detectorScores: Record<string, { score: number; weight: number }> = {}
  const flags: Set<string> = new Set()
  let totalWeightedScore = 0
  let totalWeight = 0
  let requiresHumanReview = false
  for (const result of detectorResults) detectorScores[result.detectionType] = { score: result.probability, weight: 0 }
  for (const ruleConfig of ruleConfigs) {
    const detectorResult = detectorResults.find(r => r.detectionType === ruleConfig.condition.detector)
    if (!detectorResult) continue
    const isMet = checkCondition(detectorResult.probability, ruleConfig.condition)
    if (isMet) {
      if (ruleConfig.action.flag) flags.add(ruleConfig.action.flag)
      totalWeightedScore += detectorResult.probability * ruleConfig.action.weight
      totalWeight += ruleConfig.action.weight
      if (detectorScores[ruleConfig.condition.detector]) detectorScores[ruleConfig.condition.detector].weight += ruleConfig.action.weight
      if (detectorResult.probability > 0.9) requiresHumanReview = true
    }
  }
  const ensembleScore = totalWeight > 0 ? Math.min(1, totalWeightedScore / totalWeight) : 0
  return { behaviorState: { ensembleScore: Math.round(ensembleScore * 1000) / 1000, flags: Array.from(flags), requiresHumanReview, detectors: detectorScores } }
}

function checkCondition(value: number, condition: any): boolean {
  switch (condition.operator) {
    case 'gte': return value >= condition.value
    case 'lte': return value <= condition.value
    case 'gt': return value > condition.value
    case 'lt': return value < condition.value
    case 'eq': return value === condition.value
    default: return false
  }
}

export default runEngine