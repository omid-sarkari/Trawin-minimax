export interface RawEditorEvent {
  id: number
  sessionId: string
  eventType: string
  payload: Record<string, unknown> | null
  createdAt: string
}

export interface RawCodingEvent {
  id: number
  codingSessionId: string
  eventType: string
  source: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface RawClipboardMarker {
  id: number
  codingSessionId: string
  markerType: string
  markerHash: string | null
  isInternal: boolean
  metadata: Record<string, unknown>
  createdAt: string
}

export interface RawSnapshot {
  id: string
  codingSessionId: string
  snapshotKind: string
  content: Record<string, unknown>
  filePath: string | null
  language: string | null
  baseHash: string | null
  sourceHash: string | null
  eventType: string | null
  createdAt: string
}