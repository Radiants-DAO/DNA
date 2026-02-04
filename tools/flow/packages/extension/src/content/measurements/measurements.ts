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

  // a is to the left of b
  if (a.right < b.left) {
    measurements.push({
      x: a.right,
      y: a.top + a.height / 2 - midOffset,
      d: b.left - a.right,
      q: 'right',
    });
  }

  // a is to the right of b
  if (a.left > b.right) {
    measurements.push({
      x: b.right,
      y: a.top + a.height / 2 - midOffset,
      d: a.left - b.right,
      q: 'left',
    });
  }

  // a is below b
  if (a.top > b.bottom) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: b.bottom,
      d: a.top - b.bottom,
      q: 'top',
      v: true,
    });
  }

  // a is above b
  if (a.bottom < b.top) {
    measurements.push({
      x: a.left + a.width / 2 - midOffset,
      y: a.bottom,
      d: b.top - a.bottom,
      q: 'bottom',
      v: true,
    });
  }

  // Round distances for cleaner display
  return measurements.map((m) => ({ ...m, d: Math.round(m.d * 100) / 100 }));
}
