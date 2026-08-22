"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mean = mean;
exports.standardDeviation = standardDeviation;
exports.median = median;
exports.safeRatio = safeRatio;
exports.clamp = clamp;
exports.weightedAverage = weightedAverage;
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}
function standardDeviation(values) {
    if (values.length <= 1)
        return 0;
    const avg = mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const variance = mean(squaredDiffs);
    return Math.sqrt(variance);
}
function median(values) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0)
        return (sorted[middle - 1] + sorted[middle]) / 2;
    return sorted[middle];
}
function safeRatio(numerator, denominator) {
    if (denominator === 0)
        return 0;
    return numerator / denominator;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function weightedAverage(values, weights) {
    if (values.length !== weights.length || values.length === 0)
        return 0;
    const weightedSum = values.reduce((sum, val, idx) => sum + val * weights[idx], 0);
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    return sumWeights === 0 ? 0 : weightedSum / sumWeights;
}
