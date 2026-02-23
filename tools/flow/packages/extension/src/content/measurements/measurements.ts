/**
 * Measurement between two elements, indicating distance in a specific direction.
 */
export type Measurement = {
  /** X coordinate for the measurement line/label start */
  x: number;
  /** Y coordinate for the measurement line/label start */
  y: number;
  /** Distance in pixels */
  d: number;
  /** Direction/quadrant: left, right, top, or bottom */
  q: 'left' | 'right' | 'top' | 'bottom';
  /** True if this is a vertical measurement line */
  v?: boolean;
};

/**
 * Compute measurements between two bounding rects.
 * Returns measurements for each direction where there's a gap between the rects.
 */
export function computeMeasurements(a: DOMRect, b: DOMRect): Measurement[] {
  const measurements: Measurement[] = [];
  const midOffset = 2.5; // Small offset to center labels

  // ── Right ──

  // Fully separated: a is to the left of b
  if (a.right < b.left) {
    measurements.push({
      x: a.right,
      y: a.top + a.height / 2 - midOffset,
      d: b.left - a.right,
      q: 'right',
    });
  }
  // Partial overlap: a.right is inside b horizontally
  if (a.right < b.right && a.right > b.left) {
    measurements.push({
      x: a.right,
      y: a.top + a.height / 2 - midOffset,
      d: b.right - a.right,
      q: 'right',
    });
  }

  // ── Left ──

  // Fully separated: a is to the right of b
  if (a.left > b.right) {
    measurements.push({
      x: b.right,
      y: a.top + a.height / 2 - midOffset,
      d: a.left - b.right,
      q: 'left',
    });
  }
  // Partial overlap: a.left is inside b horizontally
  else if (a.left > b.left && a.left < b.right) {
    measurements.push({
      x: b.left,
      y: a.top + a.height / 2 - midOffset,
      d: a.left - b.left,
      q: 'left',
    });
  }

  // ── Top ──

  // Fully separated: a is below b
  if (a.top > b.bottom) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: b.bottom,
      d: a.top - b.bottom,
      q: 'top',
      v: true,
    });
  }
  // Partial overlap: a.top is inside b vertically
  if (a.top > b.top && a.top < b.bottom) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: b.top,
      d: a.top - b.top,
      q: 'top',
      v: true,
    });
  }

  // ── Bottom ──

  // Fully separated: a is above b
  if (a.bottom < b.top) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: a.bottom,
      d: b.top - a.bottom,
      q: 'bottom',
      v: true,
    });
  }
  // Partial overlap: a.bottom is inside b vertically
  if (a.bottom < b.bottom && a.bottom > b.top) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: a.bottom,
      d: b.bottom - a.bottom,
      q: 'bottom',
      v: true,
    });
  }

  // ── Containing: a fully wraps b horizontally ──
  if (a.right > b.right && a.left < b.left) {
    measurements.push({
      x: b.right,
      y: a.top + a.height / 2 - midOffset,
      d: a.right - b.right,
      q: 'left',
    });
    measurements.push({
      x: a.left,
      y: a.top + a.height / 2 - midOffset,
      d: b.left - a.left,
      q: 'right',
    });
  }

  // ── Containing: a fully wraps b vertically ──
  if (a.top < b.top && a.bottom > b.bottom) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: a.top,
      d: b.top - a.top,
      q: 'bottom',
      v: true,
    });
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: b.bottom,
      d: a.bottom - b.bottom,
      q: 'top',
      v: true,
    });
  }

  // Round distances for cleaner display
  return measurements.map((m) => ({ ...m, d: Math.round(m.d * 100) / 100 }));
}
