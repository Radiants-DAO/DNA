/**
 * Dual-Mode Output Interface
 *
 * Abstraction layer supporting both clipboard output AND direct file writes.
 * Design supports both modes from day one for future extensibility.
 *
 * Panel Mode Mapping:
 * | Panel Mode         | Output Target | Behavior                        |
 * |--------------------|---------------|---------------------------------|
 * | Default (Figma-like) | clipboard   | Copy to clipboard only          |
 * | Focus (all props)   | clipboard    | Copy to clipboard only          |
 * | Advanced            | file         | Direct file write + CSS editor  |
 *
 * Inspired by Webstudio's persistence patterns, adapted for RadFlow's
 * clipboard-first workflow.
 * See: https://github.com/webstudio-is/webstudio
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) RadFlow
 */

import type { StyleEdit, SourceLocation } from "../stores/types";

/**
 * Output target for design changes.
 *
 * - "clipboard": Copy CSS to system clipboard (current behavior)
 * - "file": Direct file write (future - requires Tauri filesystem access)
 * - "both": Write to file AND copy to clipboard
 */
export type OutputTarget = "clipboard" | "file" | "both";

/**
 * Result of a persist operation.
 */
export interface PersistResult {
  success: boolean;
  target: OutputTarget;
  /** Error message if success is false */
  error?: string;
  /** Path to file written (for file target) */
  filePath?: string;
  /** Number of bytes/chars written */
  bytesWritten?: number;
}

/**
 * Options for compiling design changes to output format.
 */
export interface CompileOptions {
  /** Include file path comments in output */
  includeFilePaths?: boolean;
  /** Include timestamps in output */
  includeTimestamps?: boolean;
  /** Format: "css" for CSS declarations, "diff" for unified diff format */
  format?: "css" | "diff";
  /** Group edits by file path */
  groupByFile?: boolean;
}

/**
 * Options for persisting design changes.
 */
export interface PersistOptions {
  /** Target for persistence */
  target: OutputTarget;
  /** For file mode: specific file path to write (overrides source locations) */
  filePath?: string;
  /** For file mode: create backup before writing */
  createBackup?: boolean;
  /** Show success notification/toast */
  showNotification?: boolean;
}

/**
 * Interface for design output implementations.
 *
 * Implementations:
 * - ClipboardOutput: Copies CSS to system clipboard
 * - FileOutput: Writes directly to source files (stub for now)
 */
export interface IDesignOutput {
  /**
   * Compile accumulated style edits to string format.
   *
   * @param edits - Array of style edits to compile
   * @param options - Compilation options
   * @returns Formatted string (CSS declarations or diff)
   */
  compile(edits: StyleEdit[], options?: CompileOptions): string;

  /**
   * Persist compiled changes to target (clipboard or file).
   *
   * @param content - Compiled content to persist
   * @param options - Persistence options
   * @returns Result of the persist operation
   */
  persist(content: string, options: PersistOptions): Promise<PersistResult>;

  /**
   * Rollback last change (for file mode only).
   * Returns silently if rollback is not supported by this implementation.
   *
   * @returns Promise that resolves when rollback is complete
   */
  rollback?(): Promise<void>;

  /**
   * Check if this output implementation supports the given target.
   *
   * @param target - Target to check
   * @returns true if target is supported
   */
  supportsTarget(target: OutputTarget): boolean;
}

/**
 * Panel mode determines the default output target.
 *
 * - "default": Figma-like experience, clipboard only
 * - "focus": All properties visible, clipboard only
 * - "advanced": File writes enabled, CSS editor available
 */
export type PanelMode = "default" | "focus" | "advanced";

/**
 * Map panel mode to output target.
 */
export function panelModeToOutputTarget(mode: PanelMode): OutputTarget {
  switch (mode) {
    case "default":
    case "focus":
      return "clipboard";
    case "advanced":
      return "file";
  }
}

/**
 * Output state stored in the output slice.
 */
export interface OutputState {
  /** Current panel mode */
  panelMode: PanelMode;
  /** Current output target (derived from panel mode or overridden) */
  currentTarget: OutputTarget;
  /** Whether the target is manually overridden (not derived from panel mode) */
  targetOverridden: boolean;
  /** Last persist result for status display */
  lastPersistResult: PersistResult | null;
  /** Whether a persist operation is in progress */
  isPersisting: boolean;
}

/**
 * Output slice actions.
 */
export interface OutputActions {
  /** Set the panel mode (updates currentTarget unless overridden) */
  setPanelMode: (mode: PanelMode) => void;
  /** Override the output target (independent of panel mode) */
  setOutputTarget: (target: OutputTarget) => void;
  /** Clear the target override (revert to panel mode default) */
  clearTargetOverride: () => void;
  /** Set persist in progress state */
  setIsPersisting: (isPersisting: boolean) => void;
  /** Set last persist result */
  setLastPersistResult: (result: PersistResult | null) => void;
  /** Get the output implementation for current target */
  getOutputImplementation: () => IDesignOutput;
}

/**
 * Combined output slice type.
 */
export interface OutputSlice extends OutputState, OutputActions {}
