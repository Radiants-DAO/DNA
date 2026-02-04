export type SelectionId = string;

export interface SelectionState {
  ids: SelectionId[];
  primaryId: SelectionId | null;
}

export type SelectionAction =
  | { type: 'select'; id: SelectionId }
  | { type: 'unselect'; id: SelectionId }
  | { type: 'clear' };
