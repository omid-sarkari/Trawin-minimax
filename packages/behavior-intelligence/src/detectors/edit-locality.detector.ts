import { DetectorFunction, DetectorResult } from '../types/detector'
import { RawEditorEvent } from '../types/raw-events'

const DEFAULT_CONFIG = { maxLocalDistance: 100, localityThreshold: 0.7, minEdits: 10 }

function extractEditPositions(editorEvents: RawEditorEvent[]): Array<{ position: number; length: number }> {
  const positions: Array<{ position: number; length: number }> = []
  for (const event of editorEvents) {
    const payload = event.payload as Record<string, unknown> | null
    if (!payload) continue
    if (event.eventType === 'insert' || event.eventType === 'insertText') {
      const pos = payload.position as number | undefined
      const text = payload.text as string | undefined
      if (typeof pos === 'number') positions.push({ position: pos, length: text ? text.length : 1 })
    } else if (event.eventType === 'delete' || event.eventType === 'deleteText') {
      const pos = payload.position as number | undefined
      const len = payload.length as number | undefined
      if (typeof pos === 'number') positions.push({ position: pos, length: typeof len === 'number' ? len : 1 })
    } else if (event.eventType === 'change' || event.eventType === 'modify') {
      const from = payload.from as number | undefined
      const to = payload.to as number | undefined
      if (typeof from === 'number') positions.push({ position: from, length: typeof to === 'number' ? to - from : 1 })
    }
  }
  return positions
}

function calculatePositionDistance(a: { position: number; length: number }, b: { position: number; length: number }): number {
  return Math.abs(a.position - b.position)
}

export const editLocalityDetector: DetectorFunction = (input): DetectorResult => {
  const { editorEvents } = input
  const positions = extractEditPositions(editorEvents)
  if (positions.length < DEFAULT_CONFIG.minEdits) {
    return { detectionType: 'edit_locality', probability: 0, result: { message: 'Insufficient data', totalEdits: positions.length } }
  }
  const distances: number[] = []
  let localEditCount = 0
  for (let i = 1; i < positions.length; i++) {
    const distance = calculatePositionDistance(positions[i - 1], positions[i])
    distances.push(distance)
    if (distance <= DEFAULT_CONFIG.maxLocalDistance) localEditCount++
  }
  const locationSet = new Set(positions.map(p => p.position))
  const localityRatio = (localEditCount + 1) / positions.length
  const maxDistance = Math.max(...distances, 0)
  const meanDistance = distances.reduce((a, b) => a + b, 0) / distances.length
  let probability = 0
  if (localityRatio < DEFAULT_CONFIG.localityThreshold) {
    probability = Math.min(0.6, (DEFAULT_CONFIG.localityThreshold - localityRatio) / DEFAULT_CONFIG.localityThreshold)
  }
  if (meanDistance > DEFAULT_CONFIG.maxLocalDistance * 2) {
    probability = Math.max(probability, Math.min(0.4, (meanDistance - DEFAULT_CONFIG.maxLocalDistance * 2) / (DEFAULT_CONFIG.maxLocalDistance * 10)))
  }
  return {
    detectionType: 'edit_locality',
    probability: Math.round(probability * 100) / 100,
    result: { totalEdits: positions.length, localEdits: localEditCount + 1, localityRatio: Math.round(localityRatio * 1000) / 1000, maxDistance, meanDistance: Math.round(meanDistance * 100) / 100, distinctLocations: locationSet.size }
  }
}

export default editLocalityDetector