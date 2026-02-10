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
  mergeRuntimeInstances: (runtimeEntries: SerializedComponentEntry[]) => void;
  clearComponents: () => void;
  getComponentMeta: (fileLineKey: string) => ComponentMeta | undefined;
  getComponentMetaByName: (name: string) => ComponentMeta | undefined;
  getComponentMetaByRadflowId: (radflowId: string) => ComponentMeta | undefined;

  // Violations state
  violations: ViolationInfo[];
  violationsLoading: boolean;
  violationsError: string | null;
  violationsByFile: Map<string, ViolationInfo[]>;

  // Violations actions
  clearViolations: () => void;
  getViolationsForComponent: (file: string, line: number) => ViolationInfo[];
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
