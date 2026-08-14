import { RawEditorEvent, RawCodingEvent, RawClipboardMarker, RawSnapshot } from '../types/raw-events'
import { DetectorResult } from '../types/detector'
import { RuleConfig } from '../types/rules'
import { EngineOutput, BehaviorState } from '../types/engine'
export interface BrainInput { sessionId: string; editorEvents: RawEditorEvent[]; codingEvents: RawCodingEvent[]; clipboardMarkers: RawClipboardMarker[]; snapshots: RawSnapshot[]; ruleConfig: RuleConfig[]; engineVersion: string }
export interface NormalizedEvent { id: string | number; timestamp: number; type: 'insert' | 'delete' | 'modify' | 'paste' | 'other'; position: number | null; length: number; content: string | null; source: string; metadata: Record<string, unknown> }
export interface NormalizedSnapshot { id: string; timestamp: number; content: string; filePath: string | null; language: string | null; hash: string | null }
export interface SessionMetadata { startTime: number; endTime: number | null; durationMs: number; totalEvents: number; totalCharacters: number; languages: Set<string> }
export interface NormalizedInput { sessionId: string; events: NormalizedEvent[]; snapshots: NormalizedSnapshot[]; metadata: SessionMetadata }
export interface ProcessingResult { detectorType: string; result: DetectorResult; executionTimeMs: number; timestamp: string }
export interface ProcessingOutput { sessionId: string; results: ProcessingResult[]; totalExecutionTimeMs: number; processedAt: string }
export interface DecisionOutput { behaviorState: BehaviorState; ruleEvaluations: any[]; confidence: number; decisionTimestamp: string }
export interface BrainOutput { engineVersion: string; computedAt: string; detectorResults: DetectorResult[]; behaviorState: BehaviorState; sessionId: string }
export interface BrainConfig { input: { useEditorEvents: boolean; useCodingEvents: boolean; useClipboardMarkers: boolean; useSnapshots: boolean }; processing: { enabledDetectors: string[]; detectorTimeoutMs: number }; decision: { minConfidence: number; humanReviewThreshold: number }; output: { writeBehaviorEvents: boolean; writeCodeMetrics: boolean; updateBehaviorState: boolean } }