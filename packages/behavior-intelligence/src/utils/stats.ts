export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

export function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0
  const avg = mean(values)
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2))
  const variance = mean(squaredDiffs)
  return Math.sqrt(variance)
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2
  return sorted[middle]
}

export function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0
  const weightedSum = values.reduce((sum, val, idx) => sum + val * weights[idx], 0)
  const sumWeights = weights.reduce((sum, w) => sum + w, 0)
  return sumWeights === 0 ? 0 : weightedSum / sumWeights
}