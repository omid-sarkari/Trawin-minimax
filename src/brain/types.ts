// Brain Engine Types
export interface BrainEvent {
  sessionId: string;
  type: 'monaco' | 'yjs' | 'building_block' | 'custom';
  data: any;
  timestamp: string;
}

export interface BrainState {
  sessionId: string;
  events: BrainEvent[];
  stats: BrainStats;
  lastEvent: BrainEvent | null;
  lastUpdatedAt: string;
}

export interface BrainStats {
  totalEvents: number;
  totalKeystrokes: number;
  totalPastes: number;
  totalLines: number;
  totalCollaborations: number;
  totalBuildingBlocks: number;
}

export interface BrainResult {
  success: boolean;
  sessionId: string;
  decision: any;
  updatedAt: string;
}

export interface BrainBatchResult {
  success: boolean;
  processed: number;
  results: BrainResult[];
}

export interface BrainDecision {
  sessionId: string;
  score: number;
  trustScore: number;
  behaviorFlags: string[];
  aiUsage: {
    aiAssistedPercentage: number;
    fullyGeneratedPercentage: number;
    humanWrittenPercentage: number;
  };
  recommendations: string[];
  requiresHumanReview: boolean;
  confidence: number;
}
