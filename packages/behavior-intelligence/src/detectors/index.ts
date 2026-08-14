// Detector Registry
export * from './paste-ratio.detector';
export * from './burst-insertion.detector';
export * from './typing-rhythm.detector';
export * from './edit-locality.detector';

import { DetectorRegistry } from '../types/detector';

const detectorRegistry: DetectorRegistry = {
  paste_ratio: { detector: require('./paste-ratio.detector').pasteRatioDetector, config: require('./paste-ratio.detector').pasteRatioDetectorConfig },
  burst_insertion: { detector: require('./burst-insertion.detector').burstInsertionDetector, config: require('./burst-insertion.detector').burstInsertionDetectorConfig },
  typing_rhythm: { detector: require('./typing-rhythm.detector').typingRhythmDetector, config: require('./typing-rhythm.detector').typingRhythmDetectorConfig },
  edit_locality: { detector: require('./edit-locality.detector').editLocalityDetector, config: require('./edit-locality.detector').editLocalityDetectorConfig }
};

export function getDetectorRegistry(): DetectorRegistry { return detectorRegistry; }
export function getEnabledDetectors(): string[] { return Object.entries(detectorRegistry).filter(([_, v]) => v.config.enabled).map(([name]) => name); }

export function runAllDetectors(input: { editorEvents: any[]; codingEvents: any[]; clipboardMarkers: any[]; snapshots: any[] }): any[] {
  const results: any[] = [];
  for (const [_, { detector, config }] of Object.entries(detectorRegistry)) {
    if (config.enabled) {
      try { results.push(...detector(input)); } catch (e) { console.error(`Error in ${_}:`, e); }
    }
  }
  return results;
}