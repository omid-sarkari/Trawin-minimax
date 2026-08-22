"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_NAME = exports.VERSION = exports.diff = exports.time = exports.stats = exports.editLocalityDetector = exports.typingRhythmDetector = exports.burstInsertionDetector = exports.pasteRatioDetector = exports.runAllDetectors = exports.runDetector = exports.getDetectorNames = exports.getDetector = exports.detectorRegistry = exports.runBehaviorAnalysisWithInput = exports.runBehaviorAnalysis = exports.simpleAggregate = exports.aggregateDetectorResults = exports.runEngine = exports.getBrainConfig = exports.TEST_BRAIN_CONFIG = exports.LENIENT_BRAIN_CONFIG = exports.STRICT_BRAIN_CONFIG = exports.DEFAULT_BRAIN_CONFIG = exports.OutputLayer = exports.DecisionLayer = exports.ProcessingLayer = exports.InputLayer = exports.createBrainWithPreset = exports.createBrain = exports.BrainEngine = void 0;
var brain_1 = require("./brain");
Object.defineProperty(exports, "BrainEngine", { enumerable: true, get: function () { return brain_1.BrainEngine; } });
Object.defineProperty(exports, "createBrain", { enumerable: true, get: function () { return brain_1.createBrain; } });
Object.defineProperty(exports, "createBrainWithPreset", { enumerable: true, get: function () { return brain_1.createBrainWithPreset; } });
Object.defineProperty(exports, "InputLayer", { enumerable: true, get: function () { return brain_1.InputLayer; } });
Object.defineProperty(exports, "ProcessingLayer", { enumerable: true, get: function () { return brain_1.ProcessingLayer; } });
Object.defineProperty(exports, "DecisionLayer", { enumerable: true, get: function () { return brain_1.DecisionLayer; } });
Object.defineProperty(exports, "OutputLayer", { enumerable: true, get: function () { return brain_1.OutputLayer; } });
var config_1 = require("./brain/config");
Object.defineProperty(exports, "DEFAULT_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.DEFAULT_BRAIN_CONFIG; } });
Object.defineProperty(exports, "STRICT_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.STRICT_BRAIN_CONFIG; } });
Object.defineProperty(exports, "LENIENT_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.LENIENT_BRAIN_CONFIG; } });
Object.defineProperty(exports, "TEST_BRAIN_CONFIG", { enumerable: true, get: function () { return config_1.TEST_BRAIN_CONFIG; } });
Object.defineProperty(exports, "getBrainConfig", { enumerable: true, get: function () { return config_1.getBrainConfig; } });
var run_engine_1 = require("./engine/run-engine");
Object.defineProperty(exports, "runEngine", { enumerable: true, get: function () { return run_engine_1.runEngine; } });
var aggregate_1 = require("./engine/aggregate");
Object.defineProperty(exports, "aggregateDetectorResults", { enumerable: true, get: function () { return aggregate_1.aggregateDetectorResults; } });
Object.defineProperty(exports, "simpleAggregate", { enumerable: true, get: function () { return aggregate_1.simpleAggregate; } });
var run_behavior_analysis_1 = require("./engine/run-behavior-analysis");
Object.defineProperty(exports, "runBehaviorAnalysis", { enumerable: true, get: function () { return run_behavior_analysis_1.runBehaviorAnalysis; } });
Object.defineProperty(exports, "runBehaviorAnalysisWithInput", { enumerable: true, get: function () { return run_behavior_analysis_1.runBehaviorAnalysisWithInput; } });
var detectors_1 = require("./detectors");
Object.defineProperty(exports, "detectorRegistry", { enumerable: true, get: function () { return __importDefault(detectors_1).default; } });
var detectors_2 = require("./detectors");
Object.defineProperty(exports, "getDetector", { enumerable: true, get: function () { return detectors_2.getDetector; } });
Object.defineProperty(exports, "getDetectorNames", { enumerable: true, get: function () { return detectors_2.getDetectorNames; } });
Object.defineProperty(exports, "runDetector", { enumerable: true, get: function () { return detectors_2.runDetector; } });
Object.defineProperty(exports, "runAllDetectors", { enumerable: true, get: function () { return detectors_2.runAllDetectors; } });
var paste_ratio_detector_1 = require("./detectors/paste-ratio.detector");
Object.defineProperty(exports, "pasteRatioDetector", { enumerable: true, get: function () { return __importDefault(paste_ratio_detector_1).default; } });
var burst_insertion_detector_1 = require("./detectors/burst-insertion.detector");
Object.defineProperty(exports, "burstInsertionDetector", { enumerable: true, get: function () { return __importDefault(burst_insertion_detector_1).default; } });
var typing_rhythm_detector_1 = require("./detectors/typing-rhythm.detector");
Object.defineProperty(exports, "typingRhythmDetector", { enumerable: true, get: function () { return __importDefault(typing_rhythm_detector_1).default; } });
var edit_locality_detector_1 = require("./detectors/edit-locality.detector");
Object.defineProperty(exports, "editLocalityDetector", { enumerable: true, get: function () { return __importDefault(edit_locality_detector_1).default; } });
exports.stats = __importStar(require("./utils/stats"));
exports.time = __importStar(require("./utils/time"));
exports.diff = __importStar(require("./utils/diff"));
exports.VERSION = '1.0.0';
exports.PACKAGE_NAME = 'behavior-intelligence';
