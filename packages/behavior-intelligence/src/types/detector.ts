// Behavior Intelligence - Detector Types
export interface DetectorResult {
  detectionType: string;
  probability: number;
  result: Record<string, unknown>;
}

export interface DetectorConfig {
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  thresholds: Record<string, number>;
}

export type DetectorFunction = (input: {
  editorEvents: any[];
  codingEvents: any[];
  clipboardMarkers: any[];
  snapshots: any[];
}) => DetectorResult[];

export interface DetectorRegistry {
  [key: string]: { detector: DetectorFunction; config: DetectorConfig };
}