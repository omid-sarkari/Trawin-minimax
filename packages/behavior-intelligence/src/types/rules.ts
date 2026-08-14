// Behavior Intelligence - Rule Engine Types
export interface RuleConfig {
  ruleId: number;
  ruleName: string;
  version: number;
  condition: {
    detector: string;
    operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
    value: number;
  };
  action: {
    weight: number;
    flag: string;
  };
}

export interface RuleEvaluationResult {
  ruleId: number;
  ruleName: string;
  version: number;
  conditionMet: boolean;
  detectorValue: number | null;
  actionApplied: boolean;
  weight: number | null;
  flag: string | null;
}

export interface AggregatedRuleResults {
  totalRules: number;
  rulesMet: number;
  totalWeight: number;
  appliedFlags: string[];
  ruleEvaluations: RuleEvaluationResult[];
}