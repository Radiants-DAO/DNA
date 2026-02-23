import type { Measurement } from './measurements';

/**
 * Create a distance overlay element to display a measurement.
 */
export function createDistanceOverlay(measurement: Measurement): HTMLElement {
  const el = document.createElement('div');
  el.className = 'flow-distance-overlay';
  el.style.cssText = `
    position: absolute;
    left: ${measurement.x}px;
    top: ${measurement.y}px;
    pointer-events: none;
    background: rgba(255, 0, 153, 0.85);
    color: white;
    font: 600 10px/1 system-ui, -apple-system, sans-serif;
    padding: 1px 4px;
    border-radius: 3px;
    white-space: nowrap;
    z-index: 2147483646;
    transform: ${measurement.v ? 'translate(-50%, -100%) translateY(-4px)' : 'translate(0, -100%) translateY(-4px)'};
  `;
  el.textContent = `${measurement.d}px`;

  el.setAttribute('data-direction', measurement.q);
  if (measurement.v) {
    el.setAttribute('data-vertical', 'true');
  }

  return el;
}

/**
 * Create a measurement line between two points.
 */
export function createMeasurementLine(measurement: Measurement): HTMLElement {
  const el = document.createElement('div');
  el.className = 'flow-measurement-line';
  el.style.position = 'absolute';
  el.style.pointerEvents = 'none';
  el.style.backgroundColor = 'rgba(255, 0, 153, 0.8)';

  if (measurement.v) {
    // Vertical line
    el.style.left = `${measurement.x}px`;
    el.style.top = `${measurement.y}px`;
    el.style.width = '1px';
    el.style.height = `${measurement.d}px`;
  } else {
    // Horizontal line
    el.style.left = `${measurement.x}px`;
    el.style.top = `${measurement.y}px`;
    el.style.width = `${measurement.d}px`;
    el.style.height = '1px';
  }

  return el;
}
