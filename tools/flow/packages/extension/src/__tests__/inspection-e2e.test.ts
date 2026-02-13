import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { inspectElement } from '../content/inspector';
import { FLOW_MESSAGE_SOURCE } from '@flow/shared';
import type { InspectionResult } from '@flow/shared';

/**
 * Integration test for the inspection pipeline.
 * Tests the content-side orchestration. Agent communication is mocked
 * since we can't run a real agent script in vitest (jsdom environment).
 */
describe('inspection pipeline integration', () => {
  let el: HTMLElement;
  let agentMessageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    // Mock agent response - simulates what the agent script does
    agentMessageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'flow:content:request-fiber') {
        const elementIndex =
          typeof event.data?.elementIndex === 'number'
            ? event.data.elementIndex
            : -1;
        // Simulate agent responding with no fiber (non-React page)
        window.postMessage(
          {
            type: 'flow:agent:fiber-result',
            source: FLOW_MESSAGE_SOURCE,
            elementIndex,
            fiber: null,
            customProperties: [],
            reactGrab: null,
          },
          '*'
        );
      }
    };
    window.addEventListener('message', agentMessageHandler);
  });

  afterEach(() => {
    window.removeEventListener('message', agentMessageHandler);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('produces a complete InspectionResult for a styled element', async () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = '8px';
    el.style.padding = '16px';
    el.style.fontSize = '14px';
    el.style.color = 'rgb(255, 0, 0)';
    el.style.borderRadius = '8px';
    el.style.opacity = '0.8';

    const result: InspectionResult = await inspectElement(el);

    // Structure checks
    expect(result.tagName).toBe('div');
    expect(result.selector).toBeTruthy();
    expect(result.timestamp).toBeGreaterThan(0);

    // Fiber is null (no React in test)
    expect(result.fiber).toBeNull();

    // Layout inference
    expect(result.layout.type).toBe('flex');
    expect(result.layout.flexDirection).toBe('column');

    // Style categories should have entries
    expect(result.styles.layout.length).toBeGreaterThan(0);
    expect(result.styles.spacing.length).toBeGreaterThan(0);
    expect(result.styles.typography.length).toBeGreaterThan(0);
    expect(result.styles.colors.length).toBeGreaterThan(0);
    expect(result.styles.effects.length).toBeGreaterThan(0);
  });

  it('handles an element with no special styles', async () => {
    el = document.createElement('span');
    document.body.appendChild(el);
    el.textContent = 'hello';

    const result = await inspectElement(el);

    expect(result.tagName).toBe('span');
    // jsdom reports block for span by default
    expect(['inline', 'block']).toContain(result.layout.type);
    expect(result.fiber).toBeNull();
    expect(result.animations).toEqual([]);
  });

  it('captures grid layout properties', async () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'grid';
    el.style.gridTemplateColumns = '1fr 1fr 1fr';
    el.style.gap = '16px';

    // Add some children
    for (let i = 0; i < 6; i++) {
      el.appendChild(document.createElement('div'));
    }

    const result = await inspectElement(el);

    expect(result.layout.type).toBe('grid');
    expect(result.layout.inferredColumns).toBe(3);
    expect(result.layout.inferredRows).toBe(2);
  });

  it('includes custom properties in result (empty when none defined)', async () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const result = await inspectElement(el);

    // Custom properties come from agent, which returns empty in mock
    expect(Array.isArray(result.customProperties)).toBe(true);
  });

  it('returns valid timestamps', async () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const before = Date.now();
    const result = await inspectElement(el);
    const after = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  it('handles deeply nested elements', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let current = container;
    for (let i = 0; i < 5; i++) {
      const child = document.createElement('div');
      current.appendChild(child);
      current = child;
    }
    el = current;

    const result = await inspectElement(el);

    expect(result.tagName).toBe('div');
    // Should generate some valid selector
    expect(result.selector).toBeTruthy();
    expect(typeof result.selector).toBe('string');
    expect(result.selector.length).toBeGreaterThan(0);

    // Cleanup
    document.body.removeChild(container);
  });
});
