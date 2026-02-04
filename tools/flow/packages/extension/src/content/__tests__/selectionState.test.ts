import { describe, it, expect } from 'vitest';
import { selectionReducer, initialSelection } from '../selection/selectionState';

describe('selectionReducer', () => {
  it('adds and removes elements by id', () => {
    const s1 = selectionReducer(initialSelection, { type: 'select', id: 'a' });
    expect(s1.ids).toEqual(['a']);

    const s2 = selectionReducer(s1, { type: 'unselect', id: 'a' });
    expect(s2.ids).toEqual([]);
  });

  it('sets primaryId on select', () => {
    const s1 = selectionReducer(initialSelection, { type: 'select', id: 'a' });
    expect(s1.primaryId).toBe('a');
  });

  it('clears primaryId on unselect if it matches', () => {
    const s1 = selectionReducer(initialSelection, { type: 'select', id: 'a' });
    const s2 = selectionReducer(s1, { type: 'unselect', id: 'a' });
    expect(s2.primaryId).toBeNull();
  });

  it('clears all selection', () => {
    let state = selectionReducer(initialSelection, { type: 'select', id: 'a' });
    state = selectionReducer(state, { type: 'select', id: 'b' });
    const cleared = selectionReducer(state, { type: 'clear' });
    expect(cleared.ids).toEqual([]);
    expect(cleared.primaryId).toBeNull();
  });

  it('does not duplicate ids on repeated select', () => {
    let state = selectionReducer(initialSelection, { type: 'select', id: 'a' });
    state = selectionReducer(state, { type: 'select', id: 'a' });
    expect(state.ids).toEqual(['a']);
  });
});
