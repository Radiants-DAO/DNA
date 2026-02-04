import { selectionReducer, initialSelection } from './selectionState';
import { deepElementFromPoint } from './deepElementFromPoint';

export function createSelectionEngine() {
  let state = initialSelection;
  // Track elements by id so clear() can find them without relying on DOM queries
  const elementById = new Map<string, WeakRef<Element>>();

  function select(el: Element, id: string) {
    state = selectionReducer(state, { type: 'select', id });
    el.setAttribute('data-flow-selected', 'true');
    elementById.set(id, new WeakRef(el));
  }

  function unselect(el: Element, id: string) {
    state = selectionReducer(state, { type: 'unselect', id });
    el.removeAttribute('data-flow-selected');
    elementById.delete(id);
  }

  function clear() {
    // Clean up all tracked elements
    for (const [id, ref] of elementById) {
      const el = ref.deref();
      el?.removeAttribute('data-flow-selected');
    }
    elementById.clear();
    state = selectionReducer(state, { type: 'clear' });
  }

  return { select, unselect, clear, getState: () => state, deepElementFromPoint };
}
