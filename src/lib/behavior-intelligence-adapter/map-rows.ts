// Row Mapping Utilities
export function mapEditorEventRow(row: any) {
  return { id: row.id, sessionId: row.session_id || '', eventType: row.event_type, payload: row.payload || null, createdAt: row.created_at || '' };
}
export function mapCodingEventRow(row: any) {
  return { id: row.id, codingSessionId: row.coding_session_id, eventType: row.event_type, source: row.source, metadata: row.metadata || {}, createdAt: row.created_at };
}
export function mapClipboardMarkerRow(row: any) {
  return { id: row.id, codingSessionId: row.coding_session_id, markerType: row.marker_type, markerHash: row.marker_hash, isInternal: row.is_internal, metadata: row.metadata || {}, createdAt: row.created_at };
}
export function mapSnapshotRow(row: any) {
  return { id: row.id, codingSessionId: row.coding_session_id, snapshotKind: row.snapshot_kind, content: row.content || {}, filePath: row.file_path, language: row.language, baseHash: row.base_hash, sourceHash: row.source_hash, createdAt: row.created_at, eventType: row.event_type };
}