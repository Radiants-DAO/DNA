import type { StateCreator } from "zustand";
import type { AppState, SerializedComponentEntry } from "../types";
import { commands, type ComponentInfo, type ViolationInfo } from "../../bindings";
import type { ComponentMeta } from "../../types/componentMeta";
import {
  generateComponentMeta,
  createComponentMetaMap,
} from "../../utils/generateComponentMeta";
import {
  mergeComponentMeta,
  createMergedComponentMap,
  createRadflowIdMap,
} from "../../utils/mergeComponentMeta";

/**
 * Components Slice
 *
 * Manages component scanning/metadata + violations (merged from violationsSlice).
 */

export interface ComponentsSlice {
  // Component state
  components: ComponentInfo[];
  componentMetas: ComponentMeta[];
  componentsLoading: boolean;
  componentsError: string | null;
  componentMetaMap: Map<string, ComponentMeta>;
  componentMetaByRadflowId: Map<string, ComponentMeta>;
  componentMap: Map<string, ComponentInfo>;

  // Component actions
  scanComponents: (dir: string) => Promise<void>;
  mergeRuntimeInstances: (runtimeEntries: SerializedComponentEntry[]) => void;
  clearComponents: () => void;
  getComponentMeta: (fileLineKey: string) => ComponentMeta | undefined;
  getComponentMetaByName: (name: string) => ComponentMeta | undefined;
  getComponentMetaByRadflowId: (radflowId: string) => ComponentMeta | undefined;

  // Violations state (merged from violationsSlice)
  violations: ViolationInfo[];
  violationsLoading: boolean;
  violationsError: string | null;
  violationsByFile: Map<string, ViolationInfo[]>;

  // Violations actions
  scanViolations: (dir: string) => Promise<void>;
  clearViolations: () => void;
  getViolationsForComponent: (file: string, line: number) => ViolationInfo[];
}

export const createComponentsSlice: StateCreator<
  AppState,
  [],
  [],
  ComponentsSlice
> = (set, get) => ({
  // Component state
  components: [],
  componentMetas: [],
  componentsLoading: false,
  componentsError: null,
  componentMetaMap: new Map(),
  componentMetaByRadflowId: new Map(),
  componentMap: new Map(),

  // Violations state
  violations: [],
  violationsLoading: false,
  violationsError: null,
  violationsByFile: new Map(),

  // Component actions
  scanComponents: async (dir) => {
    set({ componentsLoading: true, componentsError: null });

    const result = await commands.scanComponents(dir);

    if (result.status === "ok") {
      const componentMap = new Map<string, ComponentInfo>();
      for (const comp of result.data) {
        const key = `${comp.file}:${comp.line}`;
        componentMap.set(key, comp);
      }

      const componentMetas = result.data.map(generateComponentMeta);
      const componentMetaMap = createComponentMetaMap(result.data);

      set({
        components: result.data,
        componentMetas,
        componentMap,
        componentMetaMap,
        componentMetaByRadflowId: new Map(),
        componentsLoading: false,
      });
    } else {
      set({ componentsError: result.error, componentsLoading: false });
    }
  },

  mergeRuntimeInstances: (runtimeEntries: SerializedComponentEntry[]) => {
    const { components } = get();

    const mergedMetas = mergeComponentMeta(components, runtimeEntries);
    const componentMetaMap = createMergedComponentMap(mergedMetas);
    const componentMetaByRadflowId = createRadflowIdMap(mergedMetas);

    set({
      componentMetas: mergedMetas,
      componentMetaMap,
      componentMetaByRadflowId,
    });
  },

  clearComponents: () =>
    set({
      components: [],
      componentMetas: [],
      componentMap: new Map(),
      componentMetaMap: new Map(),
      componentMetaByRadflowId: new Map(),
      componentsError: null,
    }),

  getComponentMeta: (fileLineKey: string): ComponentMeta | undefined => {
    return get().componentMetaMap.get(fileLineKey);
  },

  getComponentMetaByName: (name: string): ComponentMeta | undefined => {
    return get().componentMetas.find((meta) => meta.name === name);
  },

  getComponentMetaByRadflowId: (radflowId: string): ComponentMeta | undefined => {
    return get().componentMetaByRadflowId.get(radflowId);
  },

  // Violations actions
  scanViolations: async (dir) => {
    set({ violationsLoading: true, violationsError: null });
    try {
      const result = await commands.scanViolations(dir);
      if (result.status === "ok") {
        const violations = result.data;
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
    return fileViolations.filter(
      (v) => v.line >= line && v.line <= line + 50
    );
  },
});
