import { describe, it, expect } from 'vitest';
import { computeMeasurements } from '../measurements/measurements';

describe('computeMeasurements', () => {
  it('returns right distance when target is to the right', () => {
    const m = computeMeasurements(
      { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 } as DOMRect,
      { top: 0, left: 20, width: 10, height: 10, right: 30, bottom: 10 } as DOMRect
    );
    const rightMeasure = m.find((x) => x.q === 'right');
    expect(rightMeasure).toBeDefined();
    expect(rightMeasure?.d).toBe(10);
  });

  it('returns left distance when target is to the left', () => {
    const m = computeMeasurements(
      { top: 0, left: 30, width: 10, height: 10, right: 40, bottom: 10 } as DOMRect,
      { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 } as DOMRect
    );
    const leftMeasure = m.find((x) => x.q === 'left');
    expect(leftMeasure).toBeDefined();
    expect(leftMeasure?.d).toBe(20);
  });

  it('returns top distance when target is above', () => {
    const m = computeMeasurements(
      { top: 30, left: 0, width: 10, height: 10, right: 10, bottom: 40 } as DOMRect,
      { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 } as DOMRect
    );
    const topMeasure = m.find((x) => x.q === 'top');
    expect(topMeasure).toBeDefined();
    expect(topMeasure?.d).toBe(20);
    expect(topMeasure?.v).toBe(true); // vertical line
  });

  it('returns bottom distance when target is below', () => {
    const m = computeMeasurements(
      { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 } as DOMRect,
      { top: 30, left: 0, width: 10, height: 10, right: 10, bottom: 40 } as DOMRect
    );
    const bottomMeasure = m.find((x) => x.q === 'bottom');
    expect(bottomMeasure).toBeDefined();
    expect(bottomMeasure?.d).toBe(20);
    expect(bottomMeasure?.v).toBe(true); // vertical line
  });

  it('returns containment measurements when one rect fully wraps another', () => {
    const m = computeMeasurements(
      { top: 0, left: 0, width: 20, height: 20, right: 20, bottom: 20 } as DOMRect,
      { top: 5, left: 5, width: 10, height: 10, right: 15, bottom: 15 } as DOMRect
    );
    // a fully contains b — should measure distances from b's edges to a's edges
    expect(m.length).toBe(4);
    expect(m.find((x) => x.q === 'left')?.d).toBe(5);
    expect(m.find((x) => x.q === 'right')?.d).toBe(5);
    expect(m.find((x) => x.q === 'top')?.d).toBe(5);
    expect(m.find((x) => x.q === 'bottom')?.d).toBe(5);
  });
});
