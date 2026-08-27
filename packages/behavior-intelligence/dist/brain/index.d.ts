/**
 * Behavior Intelligence Brain Engine
 *
 * Architecture:
 * 1. INPUT LAYER: Normalizes raw data
 * 2. PROCESSING LAYER: Runs detectors
 * 3. DECISION LAYER: Applies rules
 * 4. OUTPUT LAYER: Formats results
 */
import { BrainInput, NormalizedInput, NormalizedEvent, NormalizedSnapshot, SessionMetadata, ProcessingOutput, DecisionOutput, BrainOutput, BrainConfig } from './types';
import { DEFAULT_BRAIN_CONFIG, getBrainConfig, STRICT_BRAIN_CONFIG, LENIENT_BRAIN_CONFIG, TEST_BRAIN_CONFIG } from './config';
import { DetectorInput } from '../types/detector';
import { RuleConfig } from '../types/rules';
import { EngineOutput } from '../types/engine';
export declare class InputLayer {
    private config;
    constructor(config: BrainConfig);
    normalize(input: BrainInput): NormalizedInput;
    private classifyEventType;
}
export declare class ProcessingLayer {
    private config;
    constructor(config: BrainConfig);
    process(normalizedInput: NormalizedInput, rawEvents?: Partial<DetectorInput>): Promise<ProcessingOutput>;
}
export declare class DecisionLayer {
    private config;
    constructor(config: BrainConfig);
    decide(processingOutput: ProcessingOutput, ruleConfig: RuleConfig[]): DecisionOutput;
    private evaluateRules;
    private calculateConfidence;
}
export declare class OutputLayer {
    format(sessionId: string, engineVersion: string, decisionOutput: DecisionOutput): BrainOutput;
    toEngineOutput(brainOutput: BrainOutput): EngineOutput;
}
export declare class BrainEngine {
    private config;
    private inputLayer;
    private processingLayer;
    private decisionLayer;
    private outputLayer;
    constructor(config?: Partial<BrainConfig>);
    process(input: BrainInput): Promise<{
        engineOutput: EngineOutput;
        brainOutput: BrainOutput;
    }>;
    static processWithConfig(input: BrainInput, config?: Partial<BrainConfig>): Promise<{
        engineOutput: EngineOutput;
        brainOutput: BrainOutput;
    }>;
    getConfig(): BrainConfig;
}
export declare function createBrain(config?: Partial<BrainConfig>): BrainEngine;
export declare function createBrainWithPreset(preset: 'default' | 'strict' | 'lenient' | 'test'): BrainEngine;
export { DEFAULT_BRAIN_CONFIG, STRICT_BRAIN_CONFIG, LENIENT_BRAIN_CONFIG, TEST_BRAIN_CONFIG, getBrainConfig };
export type { BrainInput, NormalizedInput, NormalizedEvent, NormalizedSnapshot, SessionMetadata, ProcessingOutput, DecisionOutput, BrainOutput, BrainConfig };
