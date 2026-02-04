/**
 * State for guide lines that can be positioned on the page.
 */
export interface GuidesState {
  visible: boolean;
  horizontalY: number | null;
  verticalX: number | null;
}

/**
 * Create initial guides state.
 */
export function createGuidesState(): GuidesState {
  return {
    visible: false,
    horizontalY: null,
    verticalX: null,
  };
}

/**
 * Toggle or set guide visibility.
 */
export function toggleGuideVisibility(state: GuidesState, visible?: boolean): void {
  state.visible = visible ?? !state.visible;
}

/**
 * Set guide position for horizontal or vertical guide.
 */
export function setGuidePosition(
  state: GuidesState,
  direction: 'horizontal' | 'vertical',
  position: number | null
): void {
  if (direction === 'horizontal') {
    state.horizontalY = position;
  } else {
    state.verticalX = position;
  }
}
