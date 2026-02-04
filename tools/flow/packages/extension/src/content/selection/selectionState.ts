import type { SelectionAction, SelectionState } from '@flow/shared';

export const initialSelection: SelectionState = { ids: [], primaryId: null };

export function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case 'select':
      return {
        ids: state.ids.includes(action.id) ? state.ids : [...state.ids, action.id],
        primaryId: action.id,
      };
    case 'unselect':
      return {
        ids: state.ids.filter((id) => id !== action.id),
        primaryId: state.primaryId === action.id ? null : state.primaryId,
      };
    case 'clear':
      return initialSelection;
  }
}
