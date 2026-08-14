export interface DetectorResult { detectionType: string; probability: number; result: Record<string, unknown> }
export type DetectorFunction = (input: DetectorInput) => DetectorResult | Promise<DetectorResult>
export interface DetectorInput { sessionId: string; editorEvents: any[]; codingEvents: any[]; clipboardMarkers: any[]; snapshots: any[] }
export interface DetectorRegistry { [key: string]: DetectorFunction }