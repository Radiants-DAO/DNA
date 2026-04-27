export interface MergedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Run-length encode each row to find horizontal runs of 1s,
 * then vertically merge adjacent runs with the same x and width.
 */
export function bitsToMergedRects(
  bits: string,
  w: number,
  h: number,
): MergedRect[] {
  const runs: (MergedRect | null)[] = [];

  for (let y = 0; y < h; y++) {
    let x = 0;

    while (x < w) {
      if (bits[y * w + x] === '1') {
        const start = x;

        while (x < w && bits[y * w + x] === '1') x++;

        runs.push({ x: start, y, w: x - start, h: 1 });
      } else {
        x++;
      }
    }
  }

  for (let i = 0; i < runs.length; i++) {
    if (!runs[i]) continue;

    for (let j = i + 1; j < runs.length; j++) {
      if (!runs[j]) continue;

      if (
        runs[j]!.x === runs[i]!.x &&
        runs[j]!.w === runs[i]!.w &&
        runs[j]!.y === runs[i]!.y + runs[i]!.h
      ) {
        runs[i]!.h += runs[j]!.h;
        runs[j] = null;
      }
    }
  }

  return runs.filter(Boolean) as MergedRect[];
}

/**
 * Convert a bitstring to an SVG path `d` string.
 * Uses merged rects for minimal path commands.
 */
export function bitsToPath(bits: string, w: number, h: number): string {
  return bitsToMergedRects(bits, w, h)
    .map((r) => `M${r.x},${r.y}h${r.w}v${r.h}h${-r.w}Z`)
    .join('');
}

/**
 * Wrap a path `d` string in an SVG data URI suitable for CSS `mask-image`.
 */
export function bitsToMaskURI(
  pathD: string,
  width: number,
  heightOrTransform?: number | string,
  transform?: string,
): string {
  const height = typeof heightOrTransform === 'number' ? heightOrTransform : width;
  const resolvedTransform =
    typeof heightOrTransform === 'string' ? heightOrTransform : transform;
  const t = resolvedTransform ? ` transform="${resolvedTransform}"` : '';
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges' width='${width}' height='${height}'><path fill='white'${t} d='${pathD}'/></svg>`,
  )}")`;
}
