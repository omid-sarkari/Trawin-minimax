// Behavior Intelligence - Diff Utilities
export interface CodeDiff {
  addedLines: number;
  removedLines: number;
  changedLines: number;
  similarity: number;
}

export function calculateDiff(oldCode: string, newCode: string): CodeDiff {
  const oldLines = oldCode.split('\n'), newLines = newCode.split('\n');
  const addedLines = Math.max(0, newLines.length - oldLines.length);
  const removedLines = Math.max(0, oldLines.length - newLines.length);
  const maxLength = Math.max(oldLines.length, newLines.length);
  let matchingLines = 0;
  for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
    if (oldLines[i] === newLines[i]) matchingLines++;
  }
  const similarity = maxLength > 0 ? matchingLines / maxLength : 1;
  let changedLines = 0;
  for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i]) changedLines++;
  }
  return { addedLines, removedLines, changedLines, similarity };
}

export function calculateEditLocality(snapshots: any[]): number {
  if (snapshots.length < 2) return 0.5;
  let totalEdits = 0, localizedEdits = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const oldContent = snapshots[i-1].content as { code?: string };
    const newContent = snapshots[i].content as { code?: string };
    if (oldContent?.code && newContent?.code) {
      const diff = calculateDiff(oldContent.code, newContent.code);
      totalEdits += diff.addedLines + diff.removedLines + diff.changedLines;
      if (diff.addedLines + diff.removedLines + diff.changedLines > 0) {
        const lineNumbers = Array.from({length: diff.addedLines + diff.removedLines + diff.changedLines}, (_, j) => i + j);
        if (lineNumbers.length > 0) {
          const minLine = Math.min(...lineNumbers), maxLine = Math.max(...lineNumbers);
          const range = maxLine - minLine + 1;
          if (range <= lineNumbers.length * 2) localizedEdits += lineNumbers.length;
        }
      }
    }
  }
  return totalEdits > 0 ? localizedEdits / totalEdits : 0.5;
}