// Burst Insertion Detector - Detects rapid code insertion
export const burstInsertionDetectorConfig = {
  name: 'burst_insertion',
  description: 'Detects when large amounts of code are inserted rapidly',
  version: '1.0.0',
  enabled: true,
  thresholds: { minLines: 20, maxTimeMs: 5000, highLines: 50, criticalLines: 100 }
};

export function burstInsertionDetector(input: { editorEvents: any[]; codingEvents: any[]; clipboardMarkers: any[]; snapshots: any[] }): any[] {
  const results: any[] = [];
  interface InsertionEvent { time: number; linesAdded: number; source: string; }
  const insertionEvents: InsertionEvent[] = [];
  
  for (const event of input.editorEvents) {
    if (event.eventType === 'insert' && event.createdAt) {
      const payload = event.payload as { linesAdded?: number } | undefined;
      insertionEvents.push({ time: new Date(event.createdAt).getTime(), linesAdded: payload?.linesAdded || 1, source: 'editor' });
    }
  }
  for (const event of input.codingEvents) {
    if (event.eventType === 'code_submitted' && event.createdAt) {
      const metadata = event.metadata as { linesAdded?: number } | undefined;
      insertionEvents.push({ time: new Date(event.createdAt).getTime(), linesAdded: metadata?.linesAdded || 1, source: 'coding_event' });
    }
  }
  insertionEvents.sort((a, b) => a.time - b.time);
  
  for (let i = 0; i < insertionEvents.length; i++) {
    let totalLines = insertionEvents[i].linesAdded, startTime = insertionEvents[i].time, eventCount = 1;
    for (let j = i + 1; j < insertionEvents.length; j++) {
      const timeDiff = insertionEvents[j].time - startTime;
      if (timeDiff <= burstInsertionDetectorConfig.thresholds.maxTimeMs) {
        totalLines += insertionEvents[j].linesAdded; eventCount++;
      } else break;
    }
    if (totalLines >= burstInsertionDetectorConfig.thresholds.minLines) {
      const durationMs = insertionEvents[i + eventCount - 1].time - startTime;
      const probability = Math.min(1, totalLines / burstInsertionDetectorConfig.thresholds.minLines * 0.7 + 
        (burstInsertionDetectorConfig.thresholds.maxTimeMs - durationMs) / burstInsertionDetectorConfig.thresholds.maxTimeMs * 0.3);
      results.push({
        detectionType: 'burst_insertion',
        probability,
        result: { totalLines, durationMs, eventCount, linesPerSecond: totalLines / (durationMs / 1000) }
      });
      i += eventCount - 1;
    }
  }
  return results;
}