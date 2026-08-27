"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectorRegistry = void 0;
exports.getDetectorNames = getDetectorNames;
exports.getDetector = getDetector;
exports.runAllDetectors = runAllDetectors;
exports.runDetector = runDetector;
const paste_ratio_detector_1 = __importDefault(require("./paste-ratio.detector"));
const burst_insertion_detector_1 = __importDefault(require("./burst-insertion.detector"));
const typing_rhythm_detector_1 = __importDefault(require("./typing-rhythm.detector"));
const edit_locality_detector_1 = __importDefault(require("./edit-locality.detector"));
const detectorRegistry = {
    paste_ratio: paste_ratio_detector_1.default,
    burst_insertion: burst_insertion_detector_1.default,
    typing_rhythm: typing_rhythm_detector_1.default,
    edit_locality: edit_locality_detector_1.default
};
exports.detectorRegistry = detectorRegistry;
function getDetectorNames() { return Object.keys(detectorRegistry); }
function getDetector(name) { return detectorRegistry[name]; }
async function runAllDetectors(input) {
    const results = [];
    for (const [name, detector] of Object.entries(detectorRegistry)) {
        try {
            const result = await detector(input);
            results.push(result);
        }
        catch (error) {
            results.push({ detectionType: name, probability: 0, result: { error: error instanceof Error ? error.message : String(error) } });
        }
    }
    return results;
}
async function runDetector(name, input) {
    const detector = detectorRegistry[name];
    if (!detector)
        return undefined;
    try {
        return await detector(input);
    }
    catch (error) {
        return { detectionType: name, probability: 0, result: { error: error instanceof Error ? error.message : String(error) } };
    }
}
exports.default = detectorRegistry;
