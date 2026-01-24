import { useCallback, useRef, useMemo } from "react";
import type { RadflowId } from "../stores/types";

/**
 * Style edit representing a single CSS property change.
 */
export interface StyleEdit {
  radflowId: RadflowId;
  property: string;
  value: string;
}

/**
 * Build a CSS selector from a radflowId.
 */
function buildSelector(radflowId: RadflowId): string {
  return `[data-radflow-id="${radflowId}"]`;
}

/**
 * Compile style edits into a CSS string.
 *
 * Groups edits by radflowId and creates rule blocks.
 * Example output:
 * [data-radflow-id="rf_a1b2c3"] { color: red; font-size: 16px; }
 * [data-radflow-id="rf_d4e5f6"] { background: blue; }
 */
function compileStyles(edits: StyleEdit[]): string {
  // Group edits by radflowId
  const groupedEdits = new Map<RadflowId, Map<string, string>>();

  for (const edit of edits) {
    let properties = groupedEdits.get(edit.radflowId);
    if (!properties) {
      properties = new Map();
      groupedEdits.set(edit.radflowId, properties);
    }
    // Later edits override earlier ones for the same property
    properties.set(edit.property, edit.value);
  }

  // Build CSS rules
  const rules: string[] = [];
  for (const [radflowId, properties] of groupedEdits) {
    const declarations: string[] = [];
    for (const [property, value] of properties) {
      declarations.push(`${property}: ${value}`);
    }
    if (declarations.length > 0) {
      rules.push(`${buildSelector(radflowId)} { ${declarations.join("; ")}; }`);
    }
  }

  return rules.join("\n");
}

export interface UseStyleInjectionOptions {
  /** Function to send INJECT_STYLE message to bridge */
  injectStyle: (css: string) => boolean;
  /** Function to send CLEAR_STYLES message to bridge */
  clearStyles: () => boolean;
}

export interface UseStyleInjectionReturn {
  /** Add a style edit */
  addEdit: (edit: StyleEdit) => void;
  /** Add multiple style edits */
  addEdits: (edits: StyleEdit[]) => void;
  /** Remove all edits for a radflowId */
  removeEditsForId: (radflowId: RadflowId) => void;
  /** Remove a specific property edit */
  removeEdit: (radflowId: RadflowId, property: string) => void;
  /** Clear all edits and injected styles */
  clearAll: () => void;
  /** Get current edits */
  getEdits: () => StyleEdit[];
  /** Get compiled CSS */
  getCompiledCss: () => string;
  /** Manually trigger style injection */
  flush: () => void;
}

/**
 * Hook for managing style injection into the preview iframe.
 *
 * Accumulates style edits and compiles them into CSS rules
 * that are injected via the bridge's INJECT_STYLE message.
 *
 * Features:
 * - Edits are grouped by radflowId
 * - Later edits override earlier ones for the same property
 * - Styles are scoped via [data-radflow-id] selectors
 * - Auto-injects on edit (can be batched via addEdits)
 *
 * Implementation: fn-5.5
 */
export function useStyleInjection({
  injectStyle,
  clearStyles,
}: UseStyleInjectionOptions): UseStyleInjectionReturn {
  // Store edits as a ref to avoid re-renders on every edit
  const editsRef = useRef<StyleEdit[]>([]);

  /**
   * Compile and inject current styles.
   */
  const flush = useCallback(() => {
    const css = compileStyles(editsRef.current);
    if (css) {
      injectStyle(css);
    } else {
      clearStyles();
    }
  }, [injectStyle, clearStyles]);

  /**
   * Add a single style edit.
   */
  const addEdit = useCallback(
    (edit: StyleEdit) => {
      editsRef.current = [...editsRef.current, edit];
      flush();
    },
    [flush]
  );

  /**
   * Add multiple style edits (batched).
   */
  const addEdits = useCallback(
    (edits: StyleEdit[]) => {
      editsRef.current = [...editsRef.current, ...edits];
      flush();
    },
    [flush]
  );

  /**
   * Remove all edits for a specific radflowId.
   */
  const removeEditsForId = useCallback(
    (radflowId: RadflowId) => {
      editsRef.current = editsRef.current.filter(
        (e) => e.radflowId !== radflowId
      );
      flush();
    },
    [flush]
  );

  /**
   * Remove a specific property edit.
   */
  const removeEdit = useCallback(
    (radflowId: RadflowId, property: string) => {
      editsRef.current = editsRef.current.filter(
        (e) => !(e.radflowId === radflowId && e.property === property)
      );
      flush();
    },
    [flush]
  );

  /**
   * Clear all edits and injected styles.
   */
  const clearAll = useCallback(() => {
    editsRef.current = [];
    clearStyles();
  }, [clearStyles]);

  /**
   * Get current edits.
   */
  const getEdits = useCallback(() => [...editsRef.current], []);

  /**
   * Get compiled CSS.
   */
  const getCompiledCss = useCallback(
    () => compileStyles(editsRef.current),
    []
  );

  return {
    addEdit,
    addEdits,
    removeEditsForId,
    removeEdit,
    clearAll,
    getEdits,
    getCompiledCss,
    flush,
  };
}

export default useStyleInjection;
