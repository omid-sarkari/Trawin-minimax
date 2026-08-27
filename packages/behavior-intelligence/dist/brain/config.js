"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_BRAIN_CONFIG = exports.LENIENT_BRAIN_CONFIG = exports.STRICT_BRAIN_CONFIG = exports.DEFAULT_BRAIN_CONFIG = void 0;
exports.getBrainConfig = getBrainConfig;
exports.DEFAULT_BRAIN_CONFIG = { input: { useEditorEvents: true, useCodingEvents: true, useClipboardMarkers: true, useSnapshots: true }, processing: { enabledDetectors: ['paste_ratio', 'burst_insertion', 'typing_rhythm', 'edit_locality'], detectorTimeoutMs: 5000 }, decision: { minConfidence: 0.7, humanReviewThreshold: 0.85 }, output: { writeBehaviorEvents: true, writeCodeMetrics: true, updateBehaviorState: true } };
exports.STRICT_BRAIN_CONFIG = { input: { useEditorEvents: true, useCodingEvents: true, useClipboardMarkers: true, useSnapshots: true }, processing: { enabledDetectors: ['paste_ratio', 'burst_insertion', 'typing_rhythm', 'edit_locality'], detectorTimeoutMs: 5000 }, decision: { minConfidence: 0.6, humanReviewThreshold: 0.8 }, output: { writeBehaviorEvents: true, writeCodeMetrics: true, updateBehaviorState: true } };
exports.LENIENT_BRAIN_CONFIG = { input: { useEditorEvents: true, useCodingEvents: true, useClipboardMarkers: true, useSnapshots: true }, processing: { enabledDetectors: ['paste_ratio', 'burst_insertion', 'typing_rhythm', 'edit_locality'], detectorTimeoutMs: 5000 }, decision: { minConfidence: 0.8, humanReviewThreshold: 0.95 }, output: { writeBehaviorEvents: true, writeCodeMetrics: true, updateBehaviorState: true } };
exports.TEST_BRAIN_CONFIG = { input: { useEditorEvents: true, useCodingEvents: true, useClipboardMarkers: true, useSnapshots: true }, processing: { enabledDetectors: ['paste_ratio'], detectorTimeoutMs: 1000 }, decision: { minConfidence: 0.5, humanReviewThreshold: 0.9 }, output: { writeBehaviorEvents: false, writeCodeMetrics: false, updateBehaviorState: true } };
function getBrainConfig(name) { switch (name.toLowerCase()) {
    case 'strict': return exports.STRICT_BRAIN_CONFIG;
    case 'lenient': return exports.LENIENT_BRAIN_CONFIG;
    case 'test': return exports.TEST_BRAIN_CONFIG;
    default: return exports.DEFAULT_BRAIN_CONFIG;
} }
