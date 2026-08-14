// Behavior Intelligence - Engine Types
export interface EngineInput {
  sessionId: string;
  editorEvents: any[];
  codingEvents: any[];
  clipboardMarkers: any[];
  snapshots: any[];
  ruleConfig: any[];
  engineVersion: string;
}

export interface BehaviorState {
  ensembleScore: number;
  flags: string[];
  requiresHumanReview: boolean;
  detectors: Record<string, { score: number; weight: number }>;
}

export interface EngineOutput {
  engineVersion: string;
  computedAt: string;
  detectorResults: any[];
  behaviorState: BehaviorState;
}