/**
 * Identity of an element for mutation tracking.
 */
export interface ElementIdentity {
  selector: string;
  /** Stable numeric element ID (data-flow-index) when available */
  elementIndex?: number;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
}

/**
 * A single CSS property mutation.
 */
export interface PropertyMutation {
  property: string;
  oldValue: string;
  newValue: string;
}

/**
 * A diff representing mutations applied to an element.
 */
export interface MutationDiff {
  id: string;
  element: ElementIdentity;
  type: 'style' | 'text' | 'spacing' | 'structure';
  changes: PropertyMutation[];
  timestamp: string;
}

// ─── Message Types for Mutation Commands and Responses ───

/**
 * Command to apply style changes to an element.
 */
export interface MutationApplyCommand {
  kind: 'mutation:apply';
  /** CSS selector for the target element */
  selector: string;
  /** Properties to set on element.style */
  styleChanges: Record<string, string>;
}

/**
 * Command to change an element's text content.
 */
export interface MutationTextCommand {
  kind: 'mutation:text';
  /** CSS selector for the target element */
  selector: string;
  newText: string;
}

/**
 * Toggle text edit mode on in the content script.
 */
export interface TextEditActivateCommand {
  kind: 'textEdit:activate';
}

/**
 * Toggle text edit mode off in the content script.
 */
export interface TextEditDeactivateCommand {
  kind: 'textEdit:deactivate';
}

/**
 * Command to revert a specific mutation or all mutations.
 */
export interface MutationRevertCommand {
  kind: 'mutation:revert';
  /** Mutation ID to revert, or 'all' to revert everything */
  mutationId: string | 'all';
}

/**
 * Command to clear all stored diffs without reverting DOM changes.
 */
export interface MutationClearCommand {
  kind: 'mutation:clear';
}

/**
 * Event emitted when a mutation diff is captured.
 */
export interface MutationDiffEvent {
  kind: 'mutation:diff';
  diff: MutationDiff;
}

/**
 * Event emitted when diffs are cleared.
 */
export interface MutationClearedEvent {
  kind: 'mutation:cleared';
}

/**
 * Event emitted when a mutation is reverted.
 */
export interface MutationRevertedEvent {
  kind: 'mutation:reverted';
  mutationId: string | 'all';
}

/**
 * Command to undo the last mutation (or batch) via the unified engine.
 */
export interface MutationUndoCommand {
  kind: 'mutation:undo';
}

/**
 * Command to redo the last undone mutation via the unified engine.
 */
export interface MutationRedoCommand {
  kind: 'mutation:redo';
}

/**
 * Engine state broadcast — debounced net diffs + undo/redo status.
 * Sent from content → panel whenever engine state changes.
 */
export interface MutationStateEvent {
  kind: 'mutation:state';
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  /** Net diffs: one per element+property, first oldValue → last newValue */
  netDiffs: MutationDiff[];
}

/**
 * Union of all mutation-related messages.
 */
export type MutationMessage =
  | MutationApplyCommand
  | MutationTextCommand
  | TextEditActivateCommand
  | TextEditDeactivateCommand
  | MutationUndoCommand
  | MutationRedoCommand
  | MutationRevertCommand   // Keep for backwards compat during migration
  | MutationClearCommand
  | MutationDiffEvent
  | MutationClearedEvent
  | MutationRevertedEvent
  | MutationStateEvent;
