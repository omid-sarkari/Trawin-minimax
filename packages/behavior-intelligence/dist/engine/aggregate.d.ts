import { DetectorResult } from '../types/detector';
import { RuleConfig } from '../types/rules';
import { BehaviorState } from '../types/engine';
export declare function aggregateDetectorResults(detectorResults: DetectorResult[], ruleConfigs: RuleConfig[]): BehaviorState;
export declare function checkCondition(value: number, condition: any): boolean;
export declare function simpleAggregate(detectorResults: DetectorResult[]): BehaviorState;
export default aggregateDetectorResults;
