// Behavior Intelligence - Statistics Utilities
export interface EventStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  avgEventsPerMinute: number;
  peakActivity: { time: string; count: number };
}

export interface CodeStatistics {
  totalLinesAdded: number;
  totalLinesRemoved: number;
  netLines: number;
  avgLineLength: number;
  maxLineLength: number;
  totalCharacters: number;
}

export interface SessionStatistics {
  durationMinutes: number;
  eventStats: EventStatistics;
  codeStats: CodeStatistics;
  pasteCount: number;
  externalPasteCount: number;
}

export function calculateEditorStats(events: any[]): EventStatistics {
  const eventsByType: Record<string, number> = {};
  let peakCount = 0;
  let peakTime = '';
  const timeCounts: Record<string, number> = {};
  
  for (const event of events) {
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    if (event.createdAt) {
      const minute = event.createdAt.substring(0, 16);
      timeCounts[minute] = (timeCounts[minute] || 0) + 1;
      if (timeCounts[minute] > peakCount) {
        peakCount = timeCounts[minute];
        peakTime = minute;
      }
    }
  }
  
  const totalEvents = events.length;
  const avgEventsPerMinute = totalEvents > 0 ? totalEvents / (Object.keys(timeCounts).length || 1) : 0;
  
  return {
    totalEvents,
    eventsByType,
    avgEventsPerMinute,
    peakActivity: { time: peakTime, count: peakCount },
  };
}

export function calculateClipboardStats(markers: any[]): { totalPasteCount: number; externalPasteCount: number; internalPasteCount: number } {
  let totalPasteCount = 0, externalPasteCount = 0, internalPasteCount = 0;
  for (const marker of markers) {
    if (marker.markerType === 'paste') {
      totalPasteCount++;
      if (marker.isInternal) internalPasteCount++;
      else externalPasteCount++;
    }
  }
  return { totalPasteCount, externalPasteCount, internalPasteCount };
}

export function calculateCodeMetrics(snapshots: any[]): CodeStatistics {
  let totalLinesAdded = 0, totalLinesRemoved = 0, totalCharacters = 0, totalLines = 0, maxLineLength = 0;
  for (const snapshot of snapshots) {
    if (snapshot.content && typeof snapshot.content === 'object') {
      const content = snapshot.content as { code?: string };
      if (content.code) {
        const lines = content.code.split('\n');
        totalLines += lines.length;
        totalCharacters += content.code.length;
        for (const line of lines) {
          if (line.length > maxLineLength) maxLineLength = line.length;
        }
      }
    }
  }
  return {
    totalLinesAdded,
    totalLinesRemoved,
    netLines: totalLinesAdded - totalLinesRemoved,
    avgLineLength: totalLines > 0 ? totalCharacters / totalLines : 0,
    maxLineLength,
    totalCharacters,
  };
}