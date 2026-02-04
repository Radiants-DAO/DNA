import { selectionReducer, initialSelection } from './selectionState';
import { deepElementFromPoint } from './deepElementFromPoint';

export function createSelectionEngine() {
  let state = initialSelection;

  function select(el: Element, id: string) {
    state = selectionReducer(state, { type: 'select', id });
    el.setAttribute('data-flow-selected', 'true');
  }

  function unselect(el: Element, id: string) {
    state = selectionReducer(state, { type: 'unselect', id });
    el.removeAttribute('data-flow-selected');
  }

  function clear() {
    state.ids.forEach((id) => {
      const node = document.querySelector(`[data-flow-id="${id}"]`);
      node?.removeAttribute('data-flow-selected');
    });
    state = selectionReducer(state, { type: 'clear' });
  }

  return { select, unselect, clear, getState: () => state, deepElementFromPoint };
}
