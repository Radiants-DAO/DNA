import { cdp } from './cdpBridge';
import { resolveSelectedNodeId } from './elementResolver';

export type PseudoState = 'hover' | 'focus' | 'active' | 'visited' | 'focus-within';

/**
 * Force pseudo-states on the currently selected element via CDP.
 * Allows inspecting :hover/:focus/:active styles without mouse interaction.
 */
export async function forcePseudoState(states: PseudoState[]): Promise<void> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return;

  await cdp('CSS.enable');
  await cdp('CSS.forcePseudoState', {
    nodeId,
    forcedPseudoClasses: states,
  });
}

/** Clear all forced pseudo-states on the selected element. */
export async function clearPseudoState(): Promise<void> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return;

  await cdp('CSS.forcePseudoState', {
    nodeId,
    forcedPseudoClasses: [],
  });
}
