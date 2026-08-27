"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEngine = runEngine;
const detectors_1 = require("../detectors");
const aggregate_1 = require("./aggregate");
async function runEngine(input) {
    const startTime = new Date().toISOString();
    const detectorInput = {
        sessionId: input.sessionId,
        editorEvents: input.editorEvents,
        codingEvents: input.codingEvents,
        clipboardMarkers: input.clipboardMarkers,
        snapshots: input.snapshots
    };
    const detectorResults = await (0, detectors_1.runAllDetectors)(detectorInput);
    const behaviorState = (0, aggregate_1.aggregateDetectorResults)(detectorResults, input.ruleConfig);
    return {
        engineVersion: input.engineVersion,
        computedAt: startTime,
        detectorResults,
        behaviorState
    };
}
exports.default = runEngine;
