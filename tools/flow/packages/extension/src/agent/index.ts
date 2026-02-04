import { extractFiberData } from './fiberWalker';
import { extractCustomProperties } from './customProperties';
import { FLOW_MESSAGE_SOURCE, isFlowWindowMessage } from '@flow/shared';
import type { AgentFiberResult, ContentRequestFiber, ReactGrabSource } from '@flow/shared';

/**
 * Element registry: content script assigns numeric indices to elements
 * via a data attribute, and we look them up here.
 */
function findElementByIndex(index: number): Element | null {
  return document.querySelector(`[data-flow-index="${index}"]`) ?? null;
}

/**
 * Query React Grab for source info (if installed in the app).
 * Only reads context — does NOT enable UI or hotkeys.
 */
async function getReactGrabSource(element: Element): Promise<ReactGrabSource | null> {
  const api = (window as any).__REACT_GRAB__;
  if (!api?.getSource) return null;

  try {
    const source = await api.getSource(element);
    return {
      provider: 'react-grab' as const,
      componentName: source?.componentName ?? api.getDisplayName?.(element) ?? null,
      fileName: source?.filePath ?? null,
      lineNumber: source?.lineNumber ?? null,
      columnNumber: null,
    };
  } catch {
    return null;
  }
}

/**
 * Handle incoming messages from the content script.
 */
async function handleMessage(event: MessageEvent): Promise<void> {
  // Only accept messages from the same window (content script)
  if (event.source !== window) return;
  if (!isFlowWindowMessage(event)) return;
  const data = event.data;

  switch (data.type) {
    case 'flow:content:request-fiber': {
      const msg = data as ContentRequestFiber;
      const element = findElementByIndex(msg.elementIndex);
      if (!element) {
        postResult({ fiber: null, customProperties: [], reactGrab: null });
        return;
      }

      const fiber = extractFiberData(element);
      const customProperties = extractCustomProperties(element);
      const reactGrab = await getReactGrabSource(element);

      postResult({ fiber, customProperties, reactGrab });
      break;
    }
  }
}

function postResult(
  payload: Omit<AgentFiberResult, 'type' | 'source'>
): void {
  const message: AgentFiberResult = {
    type: 'flow:agent:fiber-result',
    source: FLOW_MESSAGE_SOURCE,
    ...payload,
  };
  window.postMessage(message, window.location.origin);
}

// Listen for content script messages
window.addEventListener('message', handleMessage);
