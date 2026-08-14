// Aggregation Utilities
export function aggregateByAverage(detectorResults: any[]): number {
  if (detectorResults.length === 0) return 1.0;
  return detectorResults.reduce((sum, r) => sum + r.probability, 0) / detectorResults.length;
}

export function calculateConfidence(detectorResults: any[]): number {
  if (detectorResults.length === 0) return 1.0;
  const probabilities = detectorResults.map(r => r.probability);
  const mean = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;
  const variance = probabilities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probabilities.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, Math.min(1, 1 - Math.min(1, stdDev / 0.5)));
}

export function generateReport(detectorResults: any[], behaviorState: any): string {
  const lines = [
    '=== Behavior Intelligence Report ===',
    '',
    `Ensemble Score: ${(behaviorState.ensembleScore * 100).toFixed(2)}%`,
    `Confidence: ${(calculateConfidence(detectorResults) * 100).toFixed(2)}%`,
    `Requires Human Review: ${behaviorState.requiresHumanReview}`,
    ''
  ];
  if (behaviorState.flags.length > 0) {
    lines.push('Flags:');
    for (const flag of behaviorState.flags) lines.push(`  - ${flag}`);
    lines.push('');
  }
  lines.push('Detector Results:');
  for (const result of detectorResults) {
    lines.push(`  - ${result.detectionType}: ${(result.probability * 100).toFixed(2)}%`);
  }
  return lines.join('\n');
}

export function checkForAIUsage(detectorResults: any[], threshold = 0.7): boolean {
  if (detectorResults.length === 0) return false;
  const highProbabilityResults = detectorResults.filter((r: any) => r.probability >= threshold);
  return highProbabilityResults.length >= 2;
}