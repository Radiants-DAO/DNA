import { describe, it, expect } from 'vitest';
import { createGuidesState, toggleGuideVisibility, setGuidePosition } from '../guides/guides';

describe('guides', () => {
  it('starts with guides hidden', () => {
    const state = createGuidesState();
    expect(state.visible).toBe(false);
  });

  it('shows guides when requested', () => {
    const state = createGuidesState();
    toggleGuideVisibility(state, true);
    expect(state.visible).toBe(true);
  });

  it('hides guides when requested', () => {
    const state = createGuidesState();
    state.visible = true;
    toggleGuideVisibility(state, false);
    expect(state.visible).toBe(false);
  });

  it('toggles guide visibility', () => {
    const state = createGuidesState();
    toggleGuideVisibility(state);
    expect(state.visible).toBe(true);
    toggleGuideVisibility(state);
    expect(state.visible).toBe(false);
  });

  it('sets guide positions', () => {
    const state = createGuidesState();
    setGuidePosition(state, 'horizontal', 100);
    setGuidePosition(state, 'vertical', 200);
    expect(state.horizontalY).toBe(100);
    expect(state.verticalX).toBe(200);
  });
});
