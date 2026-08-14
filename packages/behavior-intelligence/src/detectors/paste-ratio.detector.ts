// Paste Ratio Detector - Detects external paste usage
export const pasteRatioDetectorConfig = {
  name: 'paste_ratio',
  description: 'Detects when significant code is pasted from external sources',
  version: '1.0.0',
  enabled: true,
  thresholds: { warning: 0.3, high: 0.5, critical: 0.7 }
};

export function pasteRatioDetector(input: { editorEvents: any[]; codingEvents: any[]; clipboardMarkers: any[]; snapshots: any[] }): any[] {
  const results: any[] = [];
  const externalPastes = input.clipboardMarkers.filter(m => m.markerType === 'paste' && !m.isInternal);
  const totalEvents = input.editorEvents.length + input.codingEvents.length;
  const pasteRatio = input.snapshots.length > 0 && externalPastes.length > 0 ? 
    Math.min(1, (externalPastes.length * 5) / input.snapshots.length) : 0;
  const pasteFrequency = totalEvents > 0 ? externalPastes.length / totalEvents : 0;
  const probability = Math.min(1, pasteRatio * 1.2 + pasteFrequency * 0.3);
  
  results.push({
    detectionType: 'paste_ratio',
    probability,
    result: { pasteRatio, externalPasteCount: externalPastes.length, totalPasteCount: input.clipboardMarkers.filter(m => m.markerType === 'paste').length, totalEvents, pasteFrequency }
  });
  
  if (externalPastes.length >= 3) {
    const pasteTimes = externalPastes.filter(m => m.createdAt).map(m => new Date(m.createdAt).getTime());
    if (pasteTimes.length >= 3) {
      pasteTimes.sort((a: any, b: any) => a - b);
      for (let i = 2; i < pasteTimes.length; i++) {
        if (pasteTimes[i] - pasteTimes[i-2] <= 60000) {
          results.push({
            detectionType: 'burst_paste',
            probability: 0.9,
            result: { pasteCount: 3, timeWindowMs: pasteTimes[i] - pasteTimes[i-2], message: '3+ external pastes within 1 minute' }
          });
          break;
        }
      }
    }
  }
  return results;
}