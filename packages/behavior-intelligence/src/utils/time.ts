// Behavior Intelligence - Time Utilities
export interface TimeWindow { start: string; end: string; durationMs: number; }

export function calculateTimeWindows(events: Array<{ createdAt: string | null }>): TimeWindow {
  let earliest: string | null = null, latest: string | null = null;
  for (const event of events) {
    if (event.createdAt) {
      if (!earliest || event.createdAt < earliest) earliest = event.createdAt;
      if (!latest || event.createdAt > latest) latest = event.createdAt;
    }
  }
  if (!earliest || !latest) return { start: '', end: '', durationMs: 0 };
  const startDate = new Date(earliest), endDate = new Date(latest);
  return { start: earliest, end: latest, durationMs: endDate.getTime() - startDate.getTime() };
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000), minutes = Math.floor(seconds / 60), hours = Math.floor(minutes / 60);
  const remainingSeconds = seconds % 60, remainingMinutes = minutes % 60;
  if (hours > 0) return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  else if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  else return `${seconds}s`;
}