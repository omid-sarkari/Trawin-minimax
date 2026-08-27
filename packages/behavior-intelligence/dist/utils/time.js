"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseISODate = parseISODate;
exports.formatISODate = formatISODate;
exports.timeDiffMs = timeDiffMs;
exports.timeDiffSeconds = timeDiffSeconds;
exports.timeDiffMinutes = timeDiffMinutes;
exports.nowISO = nowISO;
exports.averageInterEventInterval = averageInterEventInterval;
exports.calculateRate = calculateRate;
function parseISODate(dateString) {
    if (!dateString)
        return 0;
    return new Date(dateString).getTime();
}
function formatISODate(timestamp) {
    return new Date(timestamp).toISOString();
}
function timeDiffMs(startDate, endDate) {
    if (!startDate || !endDate)
        return 0;
    return parseISODate(endDate) - parseISODate(startDate);
}
function timeDiffSeconds(startDate, endDate) {
    return timeDiffMs(startDate, endDate) / 1000;
}
function timeDiffMinutes(startDate, endDate) {
    return timeDiffSeconds(startDate, endDate) / 60;
}
function nowISO() {
    return new Date().toISOString();
}
function averageInterEventInterval(timestamps) {
    if (timestamps.length < 2)
        return 0;
    const parsed = timestamps.map(t => parseISODate(t)).filter(t => t > 0).sort((a, b) => a - b);
    if (parsed.length < 2)
        return 0;
    let totalDiff = 0;
    for (let i = 1; i < parsed.length; i++)
        totalDiff += parsed[i] - parsed[i - 1];
    return totalDiff / (parsed.length - 1);
}
function calculateRate(count, startTime, endTime) {
    const durationMs = timeDiffMs(startTime, endTime);
    return durationMs <= 0 ? 0 : count / (durationMs / 1000);
}
