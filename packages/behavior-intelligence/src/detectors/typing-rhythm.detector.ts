import { DetectorFunction, DetectorResult } from '../types/detector'
import { RawEditorEvent } from '../types/raw-events'

const DEFAULT_CONFIG = { expectedMeanIkiMs: 200, expectedStdDevIkiMs: 100, minIntervals: 20, regularityThreshold: 0.3, irregularityThreshold: 2.0 }

function extractInterKeystrokeIntervals(editorEvents: RawEditorEvent[]): number[] {
  const timestamps: number[] = []
  for (const event of editorEvents) {
    if (event.eventType === 'insert' || event.eventType === 'insertText') {
      const payload = event.payload as Record<string, unknown> | null
      let charCount = 0
      if (payload && typeof payload.text === 'string') charCount = payload.text.length
      else if (payload && Array.isArray(payload.lines)) {
        charCount = (payload.lines as unknown[]).reduce((sum, line) => sum + (typeof line === 'string' ? line.length : 0), 0)
      }
      const timestamp = new Date(event.createdAt).getTime()
      for (let i = 0; i < charCount; i++) timestamps.push(timestamp + i)
    }
  }
  const intervals: number[] = []
  for (let i = 1; i < timestamps.length; i++) {
    const interval = timestamps[i] - timestamps[i - 1]
    if (interval >= 1) intervals.push(interval)
  }
  return intervals
}

export const typingRhythmDetector: DetectorFunction = (input): DetectorResult => {
  const { editorEvents } = input
  const intervals = extractInterKeystrokeIntervals(editorEvents)
  if (intervals.length < DEFAULT_CONFIG.minIntervals) {
    return { detectionType: 'typing_rhythm', probability: 0, result: { message: 'Insufficient data', totalIntervals: intervals.length } }
  }
  const meanIki = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - meanIki, 2), 0) / intervals.length
  const stdDevIki = Math.sqrt(variance)
  const cv = meanIki > 0 ? stdDevIki / meanIki : 0
  let probability = 0
  if (cv < DEFAULT_CONFIG.regularityThreshold) {
    probability = Math.min(0.5, (DEFAULT_CONFIG.regularityThreshold - cv) / DEFAULT_CONFIG.regularityThreshold)
  }
  if (cv > DEFAULT_CONFIG.irregularityThreshold) {
    probability = Math.max(probability, Math.min(0.5, (cv - DEFAULT_CONFIG.irregularityThreshold) / DEFAULT_CONFIG.irregularityThreshold))
  }
  const meanDeviation = Math.abs(meanIki - DEFAULT_CONFIG.expectedMeanIkiMs) / DEFAULT_CONFIG.expectedMeanIkiMs
  probability = Math.min(1, probability + meanDeviation * 0.3)
  return {
    detectionType: 'typing_rhythm',
    probability: Math.round(probability * 100) / 100,
    result: { meanIkiMs: Math.round(meanIki * 100) / 100, stdDevIkiMs: Math.round(stdDevIki * 100) / 100, coefficientOfVariation: Math.round(cv * 1000) / 1000 }
  }
}

export default typingRhythmDetector