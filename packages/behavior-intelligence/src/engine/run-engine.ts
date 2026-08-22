import { EngineInput, EngineOutput } from '../types/engine'
import { DetectorInput } from '../types/detector'
import { runAllDetectors } from '../detectors'
import { aggregateDetectorResults } from './aggregate'

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
  const behaviorState = aggregateDetectorResults(detectorResults, input.ruleConfig)
  return {
    engineVersion: input.engineVersion,
    computedAt: startTime,
    detectorResults,
    behaviorState
  }
}

export default runEngine
