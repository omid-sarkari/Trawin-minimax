// Behavior Intelligence - Engine Core
export function runEngine(input: any): any {
  const { editorEvents, codingEvents, clipboardMarkers, snapshots, ruleConfig, engineVersion } = input;
  const detectorResults = require('../detectors').runAllDetectors({ editorEvents, codingEvents, clipboardMarkers, snapshots });
  const behaviorState = aggregateDetectorResults(detectorResults, ruleConfig);
  return {
    engineVersion,
    computedAt: new Date().toISOString(),
    detectorResults,
    behaviorState
  };
}

function aggregateDetectorResults(detectorResults: any[], ruleConfigs: any[]): any {
  const behaviorState = {
    ensembleScore: 1.0,
    flags: [] as string[],
    requiresHumanReview: false,
    detectors: {} as Record<string, { score: number; weight: number }>
  };
  
  for (const result of detectorResults) {
    if (!behaviorState.detectors[result.detectionType]) {
      behaviorState.detectors[result.detectionType] = { score: 1.0, weight: 0 };
    }
    for (const rule of ruleConfigs) {
      if (rule.condition.detector === result.detectionType) {
        const conditionMet = checkCondition(rule.condition, result.probability);
        if (conditionMet) {
          behaviorState.ensembleScore -= (1 - result.probability) * rule.action.weight;
          if (rule.action.flag && !behaviorState.flags.includes(rule.action.flag)) {
            behaviorState.flags.push(rule.action.flag);
          }
          behaviorState.detectors[result.detectionType].score = Math.min(
            behaviorState.detectors[result.detectionType].score,
            1 - result.probability
          );
          behaviorState.detectors[result.detectionType].weight += rule.action.weight;
        }
      }
    }
    if (result.probability > 0.8) behaviorState.requiresHumanReview = true;
  }
  behaviorState.ensembleScore = Math.max(0, Math.min(1, behaviorState.ensembleScore));
  return behaviorState;
}

function checkCondition(condition: any, probability: number): boolean {
  switch (condition.operator) {
    case 'gte': return probability >= condition.value;
    case 'gt': return probability > condition.value;
    case 'lte': return probability <= condition.value;
    case 'lt': return probability < condition.value;
    case 'eq': return probability === condition.value;
    default: return false;
  }
}