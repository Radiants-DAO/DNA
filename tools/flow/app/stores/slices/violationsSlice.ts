import type { StateCreator } from "zustand";
import type { AppState, ViolationsSlice } from "../types";
import type { ViolationInfo } from "../../bindings";
import { commands } from "../../bindings";

export const createViolationsSlice: StateCreator<
  AppState,
  [],
  [],
  ViolationsSlice
> = (set, get) => ({
  violations: [],
  violationsLoading: false,
  violationsError: null,
  violationsByFile: new Map(),

  scanViolations: async (dir) => {
    set({ violationsLoading: true, violationsError: null });
    try {
      const result = await commands.scanViolations(dir);
      if (result.status === "ok") {
        const violations = result.data;
        // Build file -> violations map
        const violationsByFile = new Map<string, ViolationInfo[]>();
        for (const violation of violations) {
          const existing = violationsByFile.get(violation.file) || [];
          violationsByFile.set(violation.file, [...existing, violation]);
        }
        set({
          violations,
          violationsByFile,
          violationsLoading: false,
        });
      } else {
        set({
          violationsError: result.error,
          violationsLoading: false,
        });
      }
    } catch (err) {
      set({
        violationsError: err instanceof Error ? err.message : "Failed to scan violations",
        violationsLoading: false,
      });
    }
  },

  clearViolations: () =>
    set({
      violations: [],
      violationsByFile: new Map(),
      violationsError: null,
    }),

  getViolationsForComponent: (file, line) => {
    const { violationsByFile } = get();
    const fileViolations = violationsByFile.get(file) || [];
    // Return violations within a few lines of the component (components can span multiple lines)
    return fileViolations.filter(
      (v) => v.line >= line && v.line <= line + 50
    );
  },
});
