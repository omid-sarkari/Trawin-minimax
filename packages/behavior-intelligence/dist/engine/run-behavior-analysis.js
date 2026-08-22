"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBehaviorAnalysis = runBehaviorAnalysis;
exports.runBehaviorAnalysisWithInput = runBehaviorAnalysisWithInput;
const run_engine_1 = require("./run-engine");
async function runBehaviorAnalysis(adapter, codingSessionId) {
    const { editorEvents, codingEvents, clipboardMarkers, snapshots } = await adapter.fetchSessionEvents(codingSessionId);
    const [ruleConfig, engineVersion] = await Promise.all([adapter.loadActiveRuleConfig(), adapter.loadActiveEngineVersion()]);
    const input = { sessionId: codingSessionId, editorEvents, codingEvents, clipboardMarkers, snapshots, ruleConfig, engineVersion };
    const output = await (0, run_engine_1.runEngine)(input);
    await adapter.persistResults(codingSessionId, output);
}
async function runBehaviorAnalysisWithInput(adapter, input) {
    const [ruleConfig, engineVersion] = await Promise.all([adapter.loadActiveRuleConfig(), adapter.loadActiveEngineVersion()]);
    const fullInput = {
        sessionId: input.sessionId,
        editorEvents: input.editorEvents || [],
        codingEvents: input.codingEvents || [],
        clipboardMarkers: input.clipboardMarkers || [],
        snapshots: input.snapshots || [],
        ruleConfig: input.ruleConfig || ruleConfig,
        engineVersion: input.engineVersion || engineVersion
    };
    return (0, run_engine_1.runEngine)(fullInput);
}
exports.default = runBehaviorAnalysis;
