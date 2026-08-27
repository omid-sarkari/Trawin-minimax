"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateDetectorResults = aggregateDetectorResults;
exports.checkCondition = checkCondition;
exports.simpleAggregate = simpleAggregate;
function aggregateDetectorResults(detectorResults, ruleConfigs) {
    const detectorScores = {};
    const flags = new Set();
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let requiresHumanReview = false;
    for (const result of detectorResults)
        detectorScores[result.detectionType] = { score: result.probability, weight: 0 };
    for (const ruleConfig of ruleConfigs) {
        const detectorResult = detectorResults.find(r => r.detectionType === ruleConfig.condition.detector);
        if (!detectorResult)
            continue;
        const isMet = checkCondition(detectorResult.probability, ruleConfig.condition);
        if (isMet) {
            if (ruleConfig.action.flag)
                flags.add(ruleConfig.action.flag);
            totalWeightedScore += detectorResult.probability * ruleConfig.action.weight;
            totalWeight += ruleConfig.action.weight;
            if (detectorScores[ruleConfig.condition.detector])
                detectorScores[ruleConfig.condition.detector].weight += ruleConfig.action.weight;
            if (detectorResult.probability > 0.9)
                requiresHumanReview = true;
        }
    }
    const ensembleScore = totalWeight > 0 ? Math.min(1, totalWeightedScore / totalWeight) : 0;
    return { ensembleScore: Math.round(ensembleScore * 1000) / 1000, flags: Array.from(flags), requiresHumanReview, detectors: detectorScores };
}
function checkCondition(value, condition) {
    switch (condition.operator) {
        case 'gte': return value >= condition.value;
        case 'lte': return value <= condition.value;
        case 'gt': return value > condition.value;
        case 'lt': return value < condition.value;
        case 'eq': return value === condition.value;
        default: return false;
    }
}
function simpleAggregate(detectorResults) {
    const detectorScores = {};
    const flags = [];
    let maxScore = 0;
    let requiresHumanReview = false;
    for (const result of detectorResults) {
        detectorScores[result.detectionType] = { score: result.probability, weight: 1 };
        if (result.probability > maxScore)
            maxScore = result.probability;
        if (result.probability > 0.9) {
            requiresHumanReview = true;
            flags.push(`${result.detectionType}_high`);
        }
        else if (result.probability > 0.7)
            flags.push(`${result.detectionType}_medium`);
    }
    return { ensembleScore: Math.round(maxScore * 1000) / 1000, flags, requiresHumanReview, detectors: detectorScores };
}
exports.default = aggregateDetectorResults;
