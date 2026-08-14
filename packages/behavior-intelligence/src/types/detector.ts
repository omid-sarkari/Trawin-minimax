export interface DetectorResult {
  detectionType: string
  probability: number
  result: Record<string, unknown>
}

export type DetectorFunction = (input: DetectorInput) => DetectorResult | Promise<DetectorResult>

export interface DetectorInput {
  sessionId: string
  editorEvents: RawEditorEvent[]
  codingEvents: RawCodingEvent[]
  clipboardMarkers: RawClipboardMarker[]
  snapshots: RawSnapshot[]
}

export interface DetectorRegistry {
  [key: string]: DetectorFunction
}