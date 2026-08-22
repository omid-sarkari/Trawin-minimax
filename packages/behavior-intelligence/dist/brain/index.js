"use strict";
/**
 * Behavior Intelligence Brain Engine
 *
 * Architecture:
 * 1. INPUT LAYER: Normalizes raw data
 * 2. PROCESSING LAYER: Runs detectors
 * 3. DECISION LAYER: Applies rules
 * 4. OUTPUT LAYER: Formats results
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrainConfig = exports.TEST_BRAIN_CONFIG = exports.LENIENT_BRAIN_CONFIG = exports.STRICT_BRAIN_CONFIG = exports.DEFAULT_BRAIN_CONFIG = exports.BrainEngine = exports.OutputLayer = exports.DecisionLayer = exports.ProcessingLayer = exports.InputLayer = void 0;
exports.createBrain = createBrain;
exports.createBrainWithPreset = createBrainWithPreset;
const config_1 = require("./config");
Object.defineProperty(exports, "DEFAULT_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.DEFAULT_BRAIN_CONFIG; } });
Object.defineProperty(exports, "getBrainConfig", { enumerable: true, get: function () { return config_1.getBrainConfig; } });
Object.defineProperty(exports, "STRICT_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.STRICT_BRAIN_CONFIG; } });
Object.defineProperty(exports, "LENIENT_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.LENIENT_BRAIN_CONFIG; } });
Object.defineProperty(exports, "TEST_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.TEST_BRAIN_CONFIG; } });
const detectors_1 = require("../detectors");
const aggregate_1 = require("../engine/aggregate");
const nowISO = () => new Date().toISOString();
class InputLayer {
    constructor(config) { this.config = config; }
    normalize(input) {
        const events = [];
        const snapshots = [];
        const languages = new Set();
        let totalCharacters = 0;
        let startTime = Infinity;
        let endTime = 0;
        let totalEvents = 0;
        if (this.config.input.useEditorEvents) {
            for (const event of input.editorEvents) {
                const timestamp = new Date(event.createdAt).getTime();
                startTime = Math.min(startTime, timestamp);
                endTime = Math.max(endTime, timestamp);
                totalEvents++;
                const payload = event.payload;
                let charCount = 0;
                let content = null;
                if (payload && typeof payload.text === 'string') {
                    charCount = payload.text.length;
                    content = payload.text;
                }
                else if (payload && Array.isArray(payload.lines)) {
                    const lines = payload.lines;
                    charCount = lines.reduce((sum, line) => sum + (typeof line === 'string' ? line.length : 0), 0);
                    content = lines.join('\n');
                }
                totalCharacters += charCount;
                events.push({ id: event.id, timestamp, type: this.classifyEventType(event.eventType), position: payload?.position ?? null, length: charCount, content, source: 'editor', metadata: payload || {} });
            }
        }
        if (this.config.input.useCodingEvents) {
            for (const event of input.codingEvents) {
                const timestamp = new Date(event.createdAt).getTime();
                startTime = Math.min(startTime, timestamp);
                endTime = Math.max(endTime, timestamp);
                totalEvents++;
                events.push({ id: event.id, timestamp, type: this.classifyEventType(event.eventType), position: null, length: 0, content: null, source: event.source, metadata: event.metadata });
                if (event.metadata && typeof event.metadata.language === 'string')
                    languages.add(event.metadata.language);
            }
        }
        if (this.config.input.useClipboardMarkers) {
            for (const marker of input.clipboardMarkers) {
                const timestamp = new Date(marker.createdAt).getTime();
                startTime = Math.min(startTime, timestamp);
                endTime = Math.max(endTime, timestamp);
                totalEvents++;
                const metadata = marker.metadata;
                const charCount = metadata?.contentLength || 0;
                totalCharacters += charCount;
                events.push({ id: marker.id, timestamp, type: 'paste', position: null, length: charCount, content: null, source: 'clipboard', metadata: { ...metadata, isInternal: marker.isInternal, markerType: marker.markerType } });
            }
        }
        if (this.config.input.useSnapshots) {
            for (const snapshot of input.snapshots) {
                const timestamp = new Date(snapshot.createdAt).getTime();
                startTime = Math.min(startTime, timestamp);
                endTime = Math.max(endTime, timestamp);
                const content = snapshot.content;
                const contentStr = content ? JSON.stringify(content) : '';
                totalCharacters += contentStr.length;
                if (snapshot.language)
                    languages.add(snapshot.language);
                snapshots.push({ id: snapshot.id, timestamp, content: contentStr, filePath: snapshot.filePath, language: snapshot.language, hash: snapshot.baseHash || snapshot.sourceHash || null });
            }
        }
        const durationMs = endTime > 0 ? endTime - startTime : 0;
        return {
            sessionId: input.sessionId,
            events: events.sort((a, b) => a.timestamp - b.timestamp),
            snapshots: snapshots.sort((a, b) => a.timestamp - b.timestamp),
            metadata: { startTime: startTime === Infinity ? 0 : startTime, endTime: endTime === 0 ? null : endTime, durationMs, totalEvents, totalCharacters, languages }
        };
    }
    classifyEventType(eventType) {
        const lowerType = eventType.toLowerCase();
        if (lowerType.includes('insert'))
            return 'insert';
        if (lowerType.includes('delete') || lowerType.includes('remove'))
            return 'delete';
        if (lowerType.includes('modify') || lowerType.includes('change') || lowerType.includes('update'))
            return 'modify';
        if (lowerType.includes('paste'))
            return 'paste';
        return 'other';
    }
}
exports.InputLayer = InputLayer;
class ProcessingLayer {
    constructor(config) { this.config = config; }
    async process(normalizedInput, rawEvents) {
        const startTime = Date.now();
        const results = [];
        const detectorInput = {
            sessionId: normalizedInput.sessionId,
            editorEvents: rawEvents?.editorEvents ?? [],
            codingEvents: rawEvents?.codingEvents ?? [],
            clipboardMarkers: rawEvents?.clipboardMarkers ?? [],
            snapshots: rawEvents?.snapshots ?? []
        };
        for (const detectorType of this.config.processing.enabledDetectors) {
            const detectorStart = Date.now();
            try {
                const detector = (0, detectors_1.getDetector)(detectorType);
                if (!detector) {
                    console.warn(`Detector ${detectorType} not found`);
                    continue;
                }
                const result = await Promise.race([
                    detector(detectorInput),
                    new Promise((resolve) => setTimeout(() => resolve({ detectionType: detectorType, probability: 0, result: { error: 'Timeout' } }), this.config.processing.detectorTimeoutMs))
                ]);
                results.push({ detectorType, result, executionTimeMs: Date.now() - detectorStart, timestamp: nowISO() });
            }
            catch (error) {
                results.push({ detectorType, result: { detectionType: detectorType, probability: 0, result: { error: error instanceof Error ? error.message : String(error) } }, executionTimeMs: Date.now() - detectorStart, timestamp: nowISO() });
            }
        }
        return { sessionId: normalizedInput.sessionId, results, totalExecutionTimeMs: Date.now() - startTime, processedAt: nowISO() };
    }
}
exports.ProcessingLayer = ProcessingLayer;
class DecisionLayer {
    constructor(config) { this.config = config; }
    decide(processingOutput, ruleConfig) {
        const detectorResults = processingOutput.results.map(r => r.result);
        const behaviorState = (0, aggregate_1.aggregateDetectorResults)(detectorResults, ruleConfig);
        const ruleEvaluations = this.evaluateRules(detectorResults, ruleConfig);
        const confidence = this.calculateConfidence(detectorResults, behaviorState);
        return { behaviorState, ruleEvaluations, confidence, decisionTimestamp: nowISO() };
    }
    evaluateRules(detectorResults, ruleConfigs) {
        return ruleConfigs.map(ruleConfig => {
            const detectorResult = detectorResults.find(r => r.detectionType === ruleConfig.condition.detector);
            if (!detectorResult)
                return null;
            const isMet = (0, aggregate_1.checkCondition)(detectorResult.probability, ruleConfig.condition);
            return { ruleId: ruleConfig.ruleId, ruleName: ruleConfig.ruleName, detectorType: ruleConfig.condition.detector, isMet, detectorValue: detectorResult.probability, conditionValue: ruleConfig.condition.value, weight: ruleConfig.action.weight, flag: isMet ? ruleConfig.action.flag : null };
        }).filter(Boolean);
    }
    calculateConfidence(detectorResults, behaviorState) {
        if (detectorResults.length === 0)
            return 0;
        const maxProb = Math.max(...detectorResults.map(r => r.probability));
        const meanProb = detectorResults.reduce((sum, r) => sum + r.probability, 0) / detectorResults.length;
        const variance = detectorResults.reduce((sum, r) => sum + Math.pow(r.probability - meanProb, 2), 0) / detectorResults.length;
        const stdDev = Math.sqrt(variance);
        const consistencyFactor = 1 - Math.min(1, stdDev / 0.5);
        const strengthFactor = maxProb;
        let confidence = consistencyFactor * 0.4 + strengthFactor * 0.6;
        if (behaviorState.requiresHumanReview)
            confidence = Math.min(0.9, confidence * 0.9);
        return Math.round(confidence * 100) / 100;
    }
}
exports.DecisionLayer = DecisionLayer;
class OutputLayer {
    format(sessionId, engineVersion, decisionOutput) {
        const detectorResults = Object.entries(decisionOutput.behaviorState.detectors).map(([detectionType, { score, weight }]) => ({ detectionType, probability: score, result: { score, weight } }));
        return { engineVersion, computedAt: decisionOutput.decisionTimestamp, detectorResults, behaviorState: decisionOutput.behaviorState, sessionId };
    }
    toEngineOutput(brainOutput) {
        return { engineVersion: brainOutput.engineVersion, computedAt: brainOutput.computedAt, detectorResults: brainOutput.detectorResults, behaviorState: brainOutput.behaviorState };
    }
}
exports.OutputLayer = OutputLayer;
class BrainEngine {
    constructor(config = {}) {
        this.config = { ...config_1.DEFAULT_BRAIN_CONFIG, ...config };
        this.inputLayer = new InputLayer(this.config);
        this.processingLayer = new ProcessingLayer(this.config);
        this.decisionLayer = new DecisionLayer(this.config);
        this.outputLayer = new OutputLayer();
    }
    async process(input) {
        const normalizedInput = this.inputLayer.normalize(input);
        const rawEvents = {
            editorEvents: this.config.input.useEditorEvents ? input.editorEvents : [],
            codingEvents: this.config.input.useCodingEvents ? input.codingEvents : [],
            clipboardMarkers: this.config.input.useClipboardMarkers ? input.clipboardMarkers : [],
            snapshots: this.config.input.useSnapshots ? input.snapshots : []
        };
        const processingOutput = await this.processingLayer.process(normalizedInput, rawEvents);
        const decisionOutput = this.decisionLayer.decide(processingOutput, input.ruleConfig);
        const brainOutput = this.outputLayer.format(input.sessionId, input.engineVersion, decisionOutput);
        const engineOutput = this.outputLayer.toEngineOutput(brainOutput);
        return { engineOutput, brainOutput };
    }
    static async processWithConfig(input, config = {}) {
        const brain = new BrainEngine(config);
        return brain.process(input);
    }
    getConfig() { return this.config; }
}
exports.BrainEngine = BrainEngine;
function createBrain(config) { return new BrainEngine(config); }
function createBrainWithPreset(preset) { return new BrainEngine((0, config_1.getBrainConfig)(preset)); }
