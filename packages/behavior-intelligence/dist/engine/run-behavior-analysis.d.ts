import { BehaviorIntelligenceAdapter } from '../types/adapter';
import { EngineInput, EngineOutput } from '../types/engine';
export declare function runBehaviorAnalysis(adapter: BehaviorIntelligenceAdapter, codingSessionId: string): Promise<void>;
export declare function runBehaviorAnalysisWithInput(adapter: BehaviorIntelligenceAdapter, input: Partial<EngineInput> & {
    sessionId: string;
}): Promise<EngineOutput>;
export default runBehaviorAnalysis;
