import { DetectorFunction, DetectorResult } from '../types/detector'
import { RawEditorEvent } from '../types/raw-events'

const DEFAULT_CONFIG = { windowSizeMs: 5000, minCharsInWindow: 50, cpsThreshold: 20, stdDevMultiplier: 3 }

function extractInsertionEvents(editorEvents: RawEditorEvent[]): Array<{ timestamp: number; charCount: number }> {
  const insertions: Array<{ timestamp: number; charCount: number }> = []
  for (const event of editorEvents) {
    if (event.eventType === 'insert' || event.eventType === 'insertText') {
      const payload = event.payload as Record<string, unknown> | null
      let charCount = 0
      if (payload && typeof payload.text === 'string') charCount = payload.text.length
      else if (payload && Array.isArray(payload.lines)) {
        charCount = (payload.lines as string[]).reduce((sum, line) => sum + (typeof line === 'string' ? line.length : 0), 0)
      }
      if (charCount > 0) insertions.push({ timestamp: new Date(event.createdAt).getTime(), charCount })
    }
  }
  return insertions.sort((a, b) => a.timestamp - b.timestamp)
}

function calculateWindowCPS(window: Array<{ timestamp: number; charCount: number }>): number {
  if (window.length < 2) return 0
  const totalChars = window.reduce((sum, w) => sum + w.charCount, 0)
  const durationMs = window[window.length - 1].timestamp - window[0].timestamp
  return durationMs > 0 ? totalChars / (durationMs / 1000) : 0
}

export const burstInsertionDetector: DetectorFunction = (input): DetectorResult => {
  const { editorEvents } = input
  const insertions = extractInsertionEvents(editorEvents)
  if (insertions.length < 2) return { detectionType: 'burst_insertion', probability: 0, result: { totalInsertions: insertions.length } }

  const windows: Array<Array<{ timestamp: number; charCount: number }>> = []
  let currentWindow: Array<{ timestamp: number; charCount: number }> = []
  for (const insertion of insertions) {
    if (currentWindow.length === 0) currentWindow.push(insertion)
    else {
      const lastTimestamp = currentWindow[currentWindow.length - 1].timestamp
      if (insertion.timestamp - lastTimestamp <= DEFAULT_CONFIG.windowSizeMs) currentWindow.push(insertion)
      else { if (currentWindow.length >= 1) windows.push([...currentWindow]); currentWindow = [insertion] }
    }
  }
  if (currentWindow.length >= 1) windows.push(currentWindow)

  const cpsValues = windows.map(w => calculateWindowCPS(w))
  const maxCPS = Math.max(...cpsValues, 0)
  const meanCPS = cpsValues.reduce((a, b) => a + b, 0) / cpsValues.length
  const variance = cpsValues.reduce((sum, val) => sum + Math.pow(val - meanCPS, 2), 0) / cpsValues.length
  const stdDevCPS = Math.sqrt(variance)
  const burstWindows = cpsValues.filter(c => c >= DEFAULT_CONFIG.cpsThreshold).length

  let probability = 0
  if (maxCPS > DEFAULT_CONFIG.cpsThreshold) {
    const normalizedSpeed = maxCPS / DEFAULT_CONFIG.cpsThreshold
    const deviation = (maxCPS - meanCPS) / (stdDevCPS || 1)
    probability = Math.min(1, (normalizedSpeed - 1) * 0.5 + (deviation / DEFAULT_CONFIG.stdDevMultiplier) * 0.5)
    probability = Math.max(0, probability)
  }

  return {
    detectionType: 'burst_insertion',
    probability: Math.round(probability * 100) / 100,
    result: { maxCPS: Math.round(maxCPS * 100) / 100, meanCPS: Math.round(meanCPS * 100) / 100, stdDevCPS: Math.round(stdDevCPS * 100) / 100, burstWindows, totalWindows: windows.length }
  }
}

export default burstInsertionDetector