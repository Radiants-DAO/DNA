import {
  FLOW_MESSAGE_SOURCE,
  isFlowWindowMessage,
  type InspectionResult,
  type FiberData,
  type CustomProperty,
  type AgentFiberResult,
  type ReactGrabSource,
} from '@flow/shared';
import { elementRegistry, generateSelector } from './elementRegistry';
import { extractGroupedStyles } from './styleExtractor';
import { inferLayoutStructure } from './layoutInference';
import { captureAnimations } from './animationCapture';

/**
 * Request fiber data from the agent script.
 * Returns a promise that resolves when the agent responds, with a timeout.
 */
function requestFiberData(
  element: Element
): Promise<{ fiber: FiberData | null; customProperties: CustomProperty[]; reactGrab: ReactGrabSource | null }> {
  return new Promise((resolve) => {
    const elementIndex = elementRegistry.register(element);

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ fiber: null, customProperties: [], reactGrab: null });
    }, 500); // 500ms timeout — agent should respond fast

    function handler(event: MessageEvent) {
      if (event.source !== window) return;
      if (!isFlowWindowMessage(event)) return;
      if (event.data.type !== 'flow:agent:fiber-result') return;

      cleanup();
      const data = event.data as AgentFiberResult;
      resolve({
        fiber: data.fiber,
        customProperties: data.customProperties,
        reactGrab: data.reactGrab ?? null,
      });
    }

    function cleanup() {
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      // Don't unregister here - element may still be selected
    }

    window.addEventListener('message', handler);
    window.postMessage(
      {
        type: 'flow:content:request-fiber',
        source: FLOW_MESSAGE_SOURCE,
        elementIndex,
      },
      window.location.origin
    );
  });
}

/**
 * Full inspection of an element: gather fiber data (via agent),
 * computed styles, layout structure, and animations.
 */
export async function inspectElement(
  element: Element
): Promise<InspectionResult> {
  // Run agent request and content-side extraction in parallel
  const [agentData, styles, layout, animations] = await Promise.all([
    requestFiberData(element),
    Promise.resolve(extractGroupedStyles(element)),
    Promise.resolve(inferLayoutStructure(element)),
    Promise.resolve(captureAnimations(element)),
  ]);

  return {
    selector: generateSelector(element),
    tagName: element.tagName.toLowerCase(),
    fiber: agentData.fiber,
    reactGrab: agentData.reactGrab,
    styles,
    customProperties: agentData.customProperties,
    layout,
    animations,
    timestamp: Date.now(),
  };
}
