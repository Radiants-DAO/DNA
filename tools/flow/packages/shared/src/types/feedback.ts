/**
 * Feedback types shared across extension contexts.
 *
 * These types originated in the panel store but are needed by background
 * (prompt compiler, session store) and shared (session persistence).
 */

export type FeedbackType = 'comment' | 'question';

export type DataSource = 'bridge' | 'fiber' | 'dom' | 'bridge+fiber';

export interface SourceLocation {
  filePath: string;
  relativePath: string;
  line: number;
  column: number;
}

export interface RichContext {
  provenance: DataSource;
  provenanceDetail?: string;
  radflowId?: string;
  props?: Record<string, unknown>;
  parentChain?: string[];
  fiberType?: 'function' | 'class' | 'forward_ref' | 'memo';
  fallbackSelectors?: string[];
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  elementSelector: string;
  componentName: string;
  devflowId: string | null;
  source: SourceLocation | null;
  content: string;
  coordinates: { x: number; y: number };
  timestamp: number;
  richContext?: RichContext;
  /** Additional selectors beyond elementSelector (from multi-selection). */
  linkedSelectors?: string[];
}

export type Comment = Feedback;
