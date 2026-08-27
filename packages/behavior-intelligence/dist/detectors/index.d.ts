import { DetectorFunction, DetectorRegistry, DetectorResult, DetectorInput } from '../types/detector';
declare const detectorRegistry: DetectorRegistry;
export declare function getDetectorNames(): string[];
export declare function getDetector(name: string): DetectorFunction | undefined;
export declare function runAllDetectors(input: DetectorInput): Promise<DetectorResult[]>;
export declare function runDetector(name: string, input: DetectorInput): Promise<DetectorResult | undefined>;
export { detectorRegistry };
export default detectorRegistry;
