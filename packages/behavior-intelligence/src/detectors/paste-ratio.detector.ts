import { DetectorFunction, DetectorResult } from '../types/detector'
import { RawEditorEvent, RawClipboardMarker } from '../types/raw-events'

const DEFAULT_CONFIG = { threshold: 0.7, minTotalChars: 100 }

function getPastedCharCount(clipboardMarkers: RawClipboardMarker[]): number {
  let count = 0
  for (const marker of clipboardMarkers) {
    if (marker.isInternal) continue
    const metadata = marker.metadata as Record<string, unknown> | null
    if (metadata && typeof metadata.contentLength === 'number') count += metadata.contentLength
    else if (typeof marker.markerHash === 'string') count += marker.markerHash.length * 2
  }
  return count
}

function getTypedCharCount(editorEvents: RawEditorEvent[]): number {
  let count = 0
  for (const event of editorEvents) {
    const payload = event.payload as Record<string, unknown> | null
    if (event.eventType === 'insert' || event.eventType === 'insertText') {
      if (payload && typeof payload.text === 'string') count += payload.text.length
      else if (payload && Array.isArray(payload.lines)) {
        count += (payload.lines as string[]).reduce((sum, line) => sum + (typeof line === 'string' ? line.length : 0), 0)
      }
    }
  }
  return count
}

export const pasteRatioDetector: DetectorFunction = (input): DetectorResult => {
  const { editorEvents, clipboardMarkers } = input
  const pastedChars = getPastedCharCount(clipboardMarkers)
  const typedChars = getTypedCharCount(editorEvents)
  const totalChars = pastedChars + typedChars
  const ratio = totalChars > 0 ? pastedChars / totalChars : 0

  if (totalChars < DEFAULT_CONFIG.minTotalChars) {
    return { detectionType: 'paste_ratio', probability: 0, result: { message: 'Insufficient data', pastedChars, typedChars, totalChars, ratio } }
  }

  const excess = ratio - DEFAULT_CONFIG.threshold
  const probability = excess > 0 ? Math.min(1, excess / (1 - DEFAULT_CONFIG.threshold)) : 0

  return {
    detectionType: 'paste_ratio',
    probability: Math.round(probability * 100) / 100,
    result: { pastedChars, typedChars, totalChars, ratio: Math.round(ratio * 1000) / 1000, threshold: DEFAULT_CONFIG.threshold }
  }
}

export default pasteRatioDetector