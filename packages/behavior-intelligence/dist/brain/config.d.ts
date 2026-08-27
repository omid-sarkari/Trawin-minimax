import { BrainConfig } from './types';
export declare const DEFAULT_BRAIN_CONFIG: BrainConfig;
export declare const STRICT_BRAIN_CONFIG: BrainConfig;
export declare const LENIENT_BRAIN_CONFIG: BrainConfig;
export declare const TEST_BRAIN_CONFIG: BrainConfig;
export declare function getBrainConfig(name: string): BrainConfig;
