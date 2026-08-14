// Typing Rhythm Detector - Detects unnatural typing patterns
export const typingRhythmDetectorConfig = {
  name: 'typing_rhythm',
  description: 'Detects unnatural typing patterns that may indicate AI assistance',
  version: '1.0.0',
  enabled: true,
  thresholds: { humanMinStdDev: 50, humanMaxStdDev: 300, aiMinStdDev: 0, aiMaxStdDev: 30, burstThreshold: 0.3 }
};

export function typingRhythmDetector(input: { editorEvents: any[]; codingEvents: any[]; clipboardMarkers: any[]; snapshots: any[] }): any[] {
  const results: any[] = [];
  const typingEvents = input.editorEvents.filter(e => e.eventType === 'keystroke' || e.eventType === 'insert' || e.eventType === 'type');
  if (typingEvents.length < 10) return results;
  
  const times: number[] = [];
  for (let i = 1; i < typingEvents.length; i++) {
    const prev = typingEvents[i-1], curr = typingEvents[i];
    if (prev.createdAt && curr.createdAt) {
      times.push(new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime());
    }
  }
  if (times.length === 0) return results;
  
  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const burstCount = times.filter(t => t < mean * 0.3 && t > 0).length;
  const aiProbability = Math.max(0, Math.min(1, 1 - stdDev / typingRhythmDetectorConfig.thresholds.humanMaxStdDev + burstCount / (typingEvents.length * 0.1) * 0.5));
  
  let rhythmType = 'human';
  if (stdDev < typingRhythmDetectorConfig.thresholds.aiMaxStdDev) rhythmType = 'ai_suspicious';
  else if (stdDev > typingRhythmDetectorConfig.thresholds.humanMaxStdDev) rhythmType = 'erratic';
  
  results.push({
    detectionType: 'typing_rhythm',
    probability: aiProbability,
    result: { avgTimeBetweenKeystrokesMs: mean, stdDevTimeBetweenKeystrokesMs: stdDev, burstCount, totalTypingEvents: typingEvents.length, rhythmType }
  });
  
  if (stdDev < 5 && typingEvents.length > 50) {
    results.push({
      detectionType: 'perfect_typing',
      probability: 0.95,
      result: { message: 'Extremely consistent typing rhythm detected', stdDevMs: stdDev, eventCount: typingEvents.length }
    });
  }
  return results;
}