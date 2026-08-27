"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.charDiff = charDiff;
exports.similarityRatio = similarityRatio;
exports.levenshteinDistance = levenshteinDistance;
exports.isLikelyCopied = isLikelyCopied;
function charDiff(oldStr, newStr) {
    const oldLen = oldStr.length;
    const newLen = newStr.length;
    let commonPrefix = 0;
    while (commonPrefix < oldLen && commonPrefix < newLen && oldStr[commonPrefix] === newStr[commonPrefix])
        commonPrefix++;
    let commonSuffix = 0;
    while (commonSuffix < oldLen - commonPrefix && commonSuffix < newLen - commonPrefix &&
        oldStr[oldLen - 1 - commonSuffix] === newStr[newLen - 1 - commonSuffix])
        commonSuffix++;
    return oldLen + newLen - 2 * commonPrefix - 2 * commonSuffix;
}
function similarityRatio(oldStr, newStr) {
    const maxLen = Math.max(oldStr.length, newStr.length);
    return maxLen === 0 ? 1 : 1 - charDiff(oldStr, newStr) / maxLen;
}
function levenshteinDistance(a, b) {
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
    for (let i = 0; i <= b.length; i++)
        matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++)
        matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1))
                matrix[i][j] = matrix[i - 1][j - 1];
            else
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
}
function isLikelyCopied(content, sourceContent, threshold = 0.9) {
    return similarityRatio(content, sourceContent) >= threshold;
}
