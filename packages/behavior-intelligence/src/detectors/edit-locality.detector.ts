// Edit Locality Detector - Detects how localized edits are
export const editLocalityDetectorConfig = {
  name: 'edit_locality',
  description: 'Detects how localized edits are (scattered edits may indicate AI)',
  version: '1.0.0',
  enabled: true,
  thresholds: { highLocality: 0.8, lowLocality: 0.3, minEdits: 10 }
};

export function editLocalityDetector(input: { editorEvents: any[]; codingEvents: any[]; clipboardMarkers: any[]; snapshots: any[] }): any[] {
  const results: any[] = [];
  if (input.snapshots.length < editLocalityDetectorConfig.thresholds.minEdits) return results;
  
  let totalEdits = 0, localizedEdits = 0;
  for (let i = 1; i < input.snapshots.length; i++) {
    const oldContent = input.snapshots[i-1].content as { code?: string };
    const newContent = input.snapshots[i].content as { code?: string };
    if (oldContent?.code && newContent?.code) {
      const oldLines = oldContent.code.split('\n'), newLines = newContent.code.split('\n');
      const added = Math.max(0, newLines.length - oldLines.length);
      const removed = Math.max(0, oldLines.length - newLines.length);
      const changed = Math.min(oldLines.length, newLines.length) - oldLines.filter((l: string, idx: number) => newLines[idx] === l).length;
      const total = added + removed + changed;
      if (total > 0) {
        totalEdits += total;
        const lineNumbers = Array.from({length: total}, (_, j) => i + j);
        if (lineNumbers.length > 0) {
          const minLine = Math.min(...lineNumbers), maxLine = Math.max(...lineNumbers);
          const range = maxLine - minLine + 1;
          if (range <= lineNumbers.length * 2) localizedEdits += lineNumbers.length;
        }
      }
    }
  }
  const locality = totalEdits > 0 ? localizedEdits / totalEdits : 0.5;
  const probability = 1 - locality;
  let localityType = 'balanced';
  if (locality >= editLocalityDetectorConfig.thresholds.highLocality) localityType = 'highly_localized';
  else if (locality <= editLocalityDetectorConfig.thresholds.lowLocality) localityType = 'scattered';
  
  results.push({
    detectionType: 'edit_locality',
    probability,
    result: { localityScore: locality, localityType, snapshotCount: input.snapshots.length }
  });
  
  if (locality < 0.2 && input.snapshots.length > editLocalityDetectorConfig.thresholds.minEdits * 2) {
    results.push({
      detectionType: 'extreme_scattering',
      probability: 0.9,
      result: { message: 'Extremely scattered edits detected', localityScore: locality, snapshotCount: input.snapshots.length }
    });
  }
  return results;
}