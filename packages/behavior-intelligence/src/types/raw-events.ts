// Behavior Intelligence - Raw Event Types
// These types map directly to Supabase database tables

export interface RawEditorEvent {
  id: number;
  sessionId: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface RawCodingEvent {
  id: number;
  codingSessionId: string;
  eventType: string;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RawClipboardMarker {
  id: number;
  codingSessionId: string;
  markerType: string;
  markerHash: string | null;
  isInternal: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RawSnapshot {
  id: string;
  codingSessionId: string;
  snapshotKind: string;
  content: Record<string, unknown>;
  filePath: string | null;
  language: string | null;
  baseHash: string | null;
  sourceHash: string | null;
  createdAt: string;
  eventType: string | null;
}

export interface CodingSessionInfo {
  id: string;
  userId: string;
  examSessionId: string | null;
  language: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  behaviorState: Record<string, unknown> | null;
  behaviorIntelligenceVersion: string;
  lastBehaviorFlushAt: string | null;
  metadata: Record<string, unknown> | null;
  peakActivityWindow: Record<string, unknown> | null;
}

export interface SessionEvents {
  editorEvents: RawEditorEvent[];
  codingEvents: RawCodingEvent[];
  clipboardMarkers: RawClipboardMarker[];
  snapshots: RawSnapshot[];
}