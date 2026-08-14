import pasteRatioDetector from './paste-ratio.detector'
import burstInsertionDetector from './burst-insertion.detector'
import typingRhythmDetector from './typing-rhythm.detector'
import editLocalityDetector from './edit-locality.detector'
import { DetectorFunction, DetectorRegistry, DetectorResult, DetectorInput } from '../types/detector'

const detectorRegistry: DetectorRegistry = {
  paste_ratio: pasteRatioDetector,
  burst_insertion: burstInsertionDetector,
  typing_rhythm: typingRhythmDetector,
  edit_locality: editLocalityDetector
}

export function getDetectorNames(): string[] { return Object.keys(detectorRegistry) }

export function getDetector(name: string): DetectorFunction | undefined { return detectorRegistry[name] }

export async function runAllDetectors(input: DetectorInput): Promise<DetectorResult[]> {
  const results: DetectorResult[] = []
  for (const [name, detector] of Object.entries(detectorRegistry)) {
    try {
      const result = await detector(input)
      results.push(result)
    } catch (error) {
      results.push({ detectionType: name, probability: 0, result: { error: error instanceof Error ? error.message : String(error) } })
    }
  }
  return results
}

export async function runDetector(name: string, input: DetectorInput): Promise<DetectorResult | undefined> {
  const detector = detectorRegistry[name]
  if (!detector) return undefined
  try {
    return await detector(input)
  } catch (error) {
    return { detectionType: name, probability: 0, result: { error: error instanceof Error ? error.message : String(error) } }
  }
}

export { detectorRegistry }
export default detectorRegistry