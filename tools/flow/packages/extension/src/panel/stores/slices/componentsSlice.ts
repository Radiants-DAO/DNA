/**
 * Components Slice - Ported from Flow 0
 *
 * Manages component scanning/metadata + violations.
 * Component scanning is stubbed for the extension context - components will be
 * discovered via content bridge messaging instead of Tauri commands.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  SerializedComponentEntry,
  ComponentInfo,
  ViolationInfo,
  ComponentMeta,
} from "../types";

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

  // Extension-specific: set components directly from content bridge
  setComponentsFromBridge: (components: ComponentInfo[]) => void;

  // Violations state
  violations: ViolationInfo[];
  violationsLoading: boolean;
  violationsError: string | null;
  violationsByFile: Map<string, ViolationInfo[]>;

  // Violations actions
  scanViolations: (dir: string) => Promise<void>;
  clearViolations: () => void;
  getViolationsForComponent: (file: string, line: number) => ViolationInfo[];

  // Extension-specific: set violations directly from content bridge
  setViolationsFromBridge: (violations: ViolationInfo[]) => void;
}

/**
 * Generate component meta from ComponentInfo
 */
function generateComponentMeta(comp: ComponentInfo): ComponentMeta {
  return {
    name: comp.name,
    file: comp.file,
    line: comp.line,
    column: comp.column,
    props: comp.props,
  };
}

/**
 * Create a map of file:line -> ComponentMeta
 */
function createComponentMetaMap(components: ComponentInfo[]): Map<string, ComponentMeta> {
  const map = new Map<string, ComponentMeta>();
  for (const comp of components) {
    const key = `${comp.file}:${comp.line}`;
    map.set(key, generateComponentMeta(comp));
  }
  return map;
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

  // Component actions - stubbed for extension
  scanComponents: async (_dir) => {
    set({ componentsLoading: true, componentsError: null });

    // In the extension context, components are discovered via content bridge
    set({
      componentsLoading: false,
      componentsError: "Direct component scanning not supported in extension. Use setComponentsFromBridge instead.",
    });
  },

  mergeRuntimeInstances: (runtimeEntries: SerializedComponentEntry[]) => {
    const { components } = get();

    // Create merged metas from static components + runtime entries
    const mergedMetas: ComponentMeta[] = [];

    // Add static components
    for (const comp of components) {
      mergedMetas.push(generateComponentMeta(comp));
    }

    // Add runtime entries that don't have static counterparts
    const staticKeys = new Set(components.map(c => `${c.file}:${c.line}`));
    for (const entry of runtimeEntries) {
      if (entry.source) {
        const key = `${entry.source.filePath}:${entry.source.line}`;
        if (!staticKeys.has(key)) {
          mergedMetas.push({
            name: entry.name,
            file: entry.source.filePath,
            line: entry.source.line,
            column: entry.source.column,
            radflowId: entry.radflowId,
            displayName: entry.displayName ?? undefined,
            props: entry.props,
          });
        }
      }
    }

    // Build lookup maps
    const componentMetaMap = new Map<string, ComponentMeta>();
    const componentMetaByRadflowId = new Map<string, ComponentMeta>();

    for (const meta of mergedMetas) {
      const key = `${meta.file}:${meta.line}`;
      componentMetaMap.set(key, meta);
      if (meta.radflowId) {
        componentMetaByRadflowId.set(meta.radflowId, meta);
      }
    }

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

  // Extension-specific: set components directly from content bridge
  setComponentsFromBridge: (components: ComponentInfo[]) => {
    const componentMap = new Map<string, ComponentInfo>();
    for (const comp of components) {
      const key = `${comp.file}:${comp.line}`;
      componentMap.set(key, comp);
    }

    const componentMetas = components.map(generateComponentMeta);
    const componentMetaMap = createComponentMetaMap(components);

    set({
      components,
      componentMetas,
      componentMap,
      componentMetaMap,
      componentMetaByRadflowId: new Map(),
      componentsLoading: false,
      componentsError: null,
    });
  },

  // Violations actions - stubbed for extension
  scanViolations: async (_dir) => {
    set({ violationsLoading: true, violationsError: null });

    // In the extension context, violations are discovered via content bridge
    set({
      violationsLoading: false,
      violationsError: "Direct violation scanning not supported in extension. Use setViolationsFromBridge instead.",
    });
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

  // Extension-specific: set violations directly from content bridge
  setViolationsFromBridge: (violations: ViolationInfo[]) => {
    const violationsByFile = new Map<string, ViolationInfo[]>();
    for (const violation of violations) {
      const existing = violationsByFile.get(violation.file) || [];
      violationsByFile.set(violation.file, [...existing, violation]);
    }

    set({
      violations,
      violationsByFile,
      violationsLoading: false,
      violationsError: null,
    });
  },
});
