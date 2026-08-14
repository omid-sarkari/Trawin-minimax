export function parseISODate(dateString: string | null): number {
  if (!dateString) return 0
  return new Date(dateString).getTime()
}

export function formatISODate(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

export function timeDiffMs(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0
  return parseISODate(endDate) - parseISODate(startDate)
}

export function timeDiffSeconds(startDate: string | null, endDate: string | null): number {
  return timeDiffMs(startDate, endDate) / 1000
}

export function timeDiffMinutes(startDate: string | null, endDate: string | null): number {
  return timeDiffSeconds(startDate, endDate) / 60
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function averageInterEventInterval(timestamps: string[]): number {
  if (timestamps.length < 2) return 0
  const parsed = timestamps.map(t => parseISODate(t)).filter(t => t > 0).sort((a, b) => a - b)
  if (parsed.length < 2) return 0
  let totalDiff = 0
  for (let i = 1; i < parsed.length; i++) totalDiff += parsed[i] - parsed[i - 1]
  return totalDiff / (parsed.length - 1)
}

export function calculateRate(count: number, startTime: string | null, endTime: string | null): number {
  const durationMs = timeDiffMs(startTime, endTime)
  return durationMs <= 0 ? 0 : count / (durationMs / 1000)
}