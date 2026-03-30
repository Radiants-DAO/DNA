/**
 * Pretext Justify — Knuth-Plass optimal line-breaking for justified text.
 *
 * Two layout strategies:
 *   - optimalLayout()  — DP over all feasible break points (Knuth-Plass 1981)
 *   - greedyJustifiedLayout() — greedy fallback for real-time reflow
 *
 * Both operate on PreparedTextWithSegments from @chenglou/pretext and return
 * JustifiedLine[] with per-segment width data for rendering.
 *
 * DOM-free: normalSpaceWidth and hyphenWidth are parameters so the module
 * stays testable and server-safe. Use pretext-prepare.ts for measurement.
 *
 * Reference: chenglou.me/pretext/justification-comparison/
 *
 * Usage:
 *   import { optimalLayout, computeMetrics } from '@rdna/radiants/patterns/pretext-justify'
 *   const lines = optimalLayout(prepared, 300, spaceW, hyphenW)
 *   const metrics = computeMetrics(lines, spaceW)
 */

import {
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JustifiedSegment {
  text: string;
  width: number;
  isSpace: boolean;
}

export interface JustifiedLine {
  segments: JustifiedSegment[];
  lineWidth: number;
  maxWidth: number;
  isLast: boolean;
}

export interface QualityMetrics {
  avgDeviation: number;
  maxDeviation: number;
  riverCount: number;
  lineCount: number;
}

// ---------------------------------------------------------------------------
// Greedy justified layout
// ---------------------------------------------------------------------------

/**
 * Greedy line-breaking using pretext's layoutNextLine, then extracting
 * per-segment data for justified rendering. Faster than optimalLayout
 * but produces worse spacing — use as fallback for obstacle-adjacent lines
 * or during real-time drag reflow.
 */
export function greedyJustifiedLayout(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  _normalSpaceW: number,
  hyphenWidth: number,
): JustifiedLine[] {
  const segs = prepared.segments;
  const widths = prepared.widths;
  const lines: JustifiedLine[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

  while (true) {
    const line = layoutNextLine(prepared, cursor, maxWidth);
    if (line === null) break;

    const isLast = line.end.segmentIndex >= segs.length;
    const segments: JustifiedSegment[] = [];
    let endsWithHyphen = false;

    for (let si = line.start.segmentIndex; si < line.end.segmentIndex; si++) {
      const text = segs[si]!;
      if (text === '\u00AD') {
        if (si === line.end.segmentIndex - 1) endsWithHyphen = true;
        continue;
      }
      const width = widths[si]!;
      const isSpace = text.trim().length === 0;
      segments.push({ text, width, isSpace });
    }

    // Check if segment after break is a soft hyphen
    if (!endsWithHyphen && line.end.segmentIndex < segs.length) {
      if (segs[line.end.segmentIndex] === '\u00AD') endsWithHyphen = true;
    }

    if (endsWithHyphen && !isLast) {
      segments.push({ text: '-', width: hyphenWidth, isSpace: false });
    }

    // Trim trailing spaces
    while (segments.length > 0 && segments[segments.length - 1]!.isSpace) {
      segments.pop();
    }

    let lw = 0;
    for (const seg of segments) lw += seg.width;

    lines.push({ segments, lineWidth: lw, maxWidth, isLast });
    cursor = line.end;
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Knuth-Plass optimal layout
// ---------------------------------------------------------------------------

interface LineInfo {
  wordWidth: number;
  spaceCount: number;
  endsWithHyphen: boolean;
}

/**
 * Optimal paragraph layout via dynamic programming over all feasible
 * breakpoints (word boundaries + soft-hyphen positions). Minimizes total
 * badness — cubic stretch ratio with river and tight-spacing penalties.
 */
export function optimalLayout(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  normalSpaceW: number,
  hyphenWidth: number,
): JustifiedLine[] {
  const segs = prepared.segments;
  const widths = prepared.widths;
  const n = segs.length;

  if (n === 0) return [];

  // Build break candidates
  interface BreakCandidate {
    segIndex: number;
    isSoftHyphen: boolean;
  }
  const candidates: BreakCandidate[] = [{ segIndex: 0, isSoftHyphen: false }];

  for (let i = 0; i < n; i++) {
    const text = segs[i]!;
    if (text === '\u00AD') {
      if (i + 1 < n) candidates.push({ segIndex: i + 1, isSoftHyphen: true });
    } else if (text.trim().length === 0 && i + 1 < n) {
      candidates.push({ segIndex: i + 1, isSoftHyphen: false });
    }
  }
  candidates.push({ segIndex: n, isSoftHyphen: false });

  const numCandidates = candidates.length;

  function getLineInfo(fromIdx: number, toIdx: number): LineInfo {
    const from = candidates[fromIdx]!.segIndex;
    const to = candidates[toIdx]!.segIndex;
    const endsWithHyphen = candidates[toIdx]!.isSoftHyphen;
    let wordWidth = 0;
    let spaceCount = 0;

    for (let si = from; si < to; si++) {
      const text = segs[si]!;
      if (text === '\u00AD') continue;
      if (text.trim().length === 0) {
        spaceCount++;
      } else {
        wordWidth += widths[si]!;
      }
    }

    // Trailing space hangs past line edge
    if (to > from && segs[to - 1]!.trim().length === 0) {
      spaceCount--;
    }

    if (endsWithHyphen) wordWidth += hyphenWidth;

    return { wordWidth, spaceCount, endsWithHyphen };
  }

  function lineBadness(info: LineInfo, isLastLine: boolean): number {
    if (isLastLine) {
      return info.wordWidth > maxWidth ? 1e8 : 0;
    }

    if (info.spaceCount <= 0) {
      const slack = maxWidth - info.wordWidth;
      return slack < 0 ? 1e8 : slack * slack * 10;
    }

    const justifiedSpace = (maxWidth - info.wordWidth) / info.spaceCount;
    if (justifiedSpace < 0) return 1e8;
    if (justifiedSpace < normalSpaceW * 0.4) return 1e8;

    const ratio = (justifiedSpace - normalSpaceW) / normalSpaceW;
    const absRatio = Math.abs(ratio);
    const badness = absRatio * absRatio * absRatio * 1000;

    // River penalty (> 1.5× normal space)
    const riverExcess = justifiedSpace / normalSpaceW - 1.5;
    const riverPenalty = riverExcess > 0
      ? 5000 + riverExcess * riverExcess * 10000
      : 0;

    // Tight penalty (< 0.65× normal space)
    const tightThreshold = normalSpaceW * 0.65;
    const tightPenalty = justifiedSpace < tightThreshold
      ? 3000 + (tightThreshold - justifiedSpace) * (tightThreshold - justifiedSpace) * 10000
      : 0;

    // Small hyphen break penalty
    const hyphenPenalty = info.endsWithHyphen ? 50 : 0;

    return badness + riverPenalty + tightPenalty + hyphenPenalty;
  }

  // DP
  const dp: number[] = new Array(numCandidates).fill(Infinity);
  const prev: number[] = new Array(numCandidates).fill(-1);
  dp[0] = 0;

  for (let j = 1; j < numCandidates; j++) {
    const isLast = j === numCandidates - 1;
    for (let i = j - 1; i >= 0; i--) {
      if (dp[i] === Infinity) continue;
      const info = getLineInfo(i, j);
      const totalWidth = info.wordWidth + info.spaceCount * normalSpaceW;
      if (totalWidth > maxWidth * 2) break;

      const bad = lineBadness(info, isLast);
      const total = dp[i]! + bad;
      if (total < dp[j]!) {
        dp[j] = total;
        prev[j] = i;
      }
    }
  }

  // Trace back
  const breakIndices: number[] = [];
  let cur = numCandidates - 1;
  while (cur > 0) {
    if (prev[cur] === -1) { cur--; continue; }
    breakIndices.push(cur);
    cur = prev[cur]!;
  }
  breakIndices.reverse();

  // Fallback: if DP found no valid path (e.g. single word wider than
  // maxWidth), emit the entire text as one overflow line rather than
  // returning nothing.
  if (breakIndices.length === 0 && n > 0) {
    const segments: JustifiedSegment[] = [];
    for (let si = 0; si < n; si++) {
      const text = segs[si]!;
      if (text === '\u00AD') continue;
      segments.push({ text, width: widths[si]!, isSpace: text.trim().length === 0 });
    }
    while (segments.length > 0 && segments[segments.length - 1]!.isSpace) segments.pop();
    let lw = 0;
    for (const seg of segments) lw += seg.width;
    return [{ segments, lineWidth: lw, maxWidth, isLast: true }];
  }

  // Build lines
  const lines: JustifiedLine[] = [];
  let fromCandidate = 0;

  for (let bi = 0; bi < breakIndices.length; bi++) {
    const toCandidate = breakIndices[bi]!;
    const from = candidates[fromCandidate]!.segIndex;
    const to = candidates[toCandidate]!.segIndex;
    const endsWithHyphen = candidates[toCandidate]!.isSoftHyphen;
    const isLast = toCandidate === numCandidates - 1;

    const segments: JustifiedSegment[] = [];
    for (let si = from; si < to; si++) {
      const text = segs[si]!;
      if (text === '\u00AD') continue;
      const width = widths[si]!;
      const isSpace = text.trim().length === 0;
      segments.push({ text, width, isSpace });
    }

    if (endsWithHyphen) {
      segments.push({ text: '-', width: hyphenWidth, isSpace: false });
    }

    while (segments.length > 0 && segments[segments.length - 1]!.isSpace) {
      segments.pop();
    }

    let lw = 0;
    for (const seg of segments) lw += seg.width;

    lines.push({ segments, lineWidth: lw, maxWidth, isLast });
    fromCandidate = toCandidate;
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Quality metrics
// ---------------------------------------------------------------------------

/**
 * Compute justification quality metrics: average/max space deviation from
 * ideal, and river count (spaces > 1.5× normal width).
 */
export function computeMetrics(
  allLines: JustifiedLine[],
  normalSpaceW: number,
): QualityMetrics {
  let totalDev = 0;
  let maxDev = 0;
  let count = 0;
  let rivers = 0;

  for (const line of allLines) {
    if (line.isLast) continue;

    let wordWidth = 0;
    let spaceCount = 0;
    for (const seg of line.segments) {
      if (seg.isSpace) spaceCount++;
      else wordWidth += seg.width;
    }

    if (spaceCount <= 0) continue;

    const justifiedSpace = (line.maxWidth - wordWidth) / spaceCount;
    const deviation = Math.abs(justifiedSpace - normalSpaceW) / normalSpaceW;

    totalDev += deviation;
    if (deviation > maxDev) maxDev = deviation;
    count++;

    if (justifiedSpace > normalSpaceW * 1.5) rivers++;
  }

  return {
    avgDeviation: count > 0 ? totalDev / count : 0,
    maxDeviation: maxDev,
    riverCount: rivers,
    lineCount: allLines.length,
  };
}
