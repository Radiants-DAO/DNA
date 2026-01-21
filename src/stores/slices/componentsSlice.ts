import type { StateCreator } from "zustand";
import type { AppState, ComponentsSlice, SerializedComponentEntry } from "../types";
import { commands, type ComponentInfo } from "../../bindings";
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

export const createComponentsSlice: StateCreator<
  AppState,
  [],
  [],
  ComponentsSlice
> = (set, get) => ({
  components: [],
  componentMetas: [],
  componentsLoading: false,
  componentsError: null,
  componentMetaMap: new Map(),
  componentMetaByRadflowId: new Map(),
  componentMap: new Map(), // Legacy - backward compatibility

  scanComponents: async (dir) => {
    set({ componentsLoading: true, componentsError: null });

    const result = await commands.scanComponents(dir);

    if (result.status === "ok") {
      // Build legacy lookup map: file:line -> ComponentInfo
      const componentMap = new Map<string, ComponentInfo>();
      for (const comp of result.data) {
        const key = `${comp.file}:${comp.line}`;
        componentMap.set(key, comp);
      }

      // Generate ComponentMeta for each component (static analysis only)
      const componentMetas = result.data.map(generateComponentMeta);

      // Build ComponentMeta lookup map: file:line -> ComponentMeta
      const componentMetaMap = createComponentMetaMap(result.data);

      set({
        components: result.data,
        componentMetas,
        componentMap,
        componentMetaMap,
        componentMetaByRadflowId: new Map(), // Will be populated on merge
        componentsLoading: false,
      });
    } else {
      set({ componentsError: result.error, componentsLoading: false });
    }
  },

  mergeRuntimeInstances: (runtimeEntries: SerializedComponentEntry[]) => {
    const { components } = get();

    // Merge static analysis with runtime fiber data (ADR-4 hybrid discovery)
    const mergedMetas = mergeComponentMeta(components, runtimeEntries);

    // Build lookup maps
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
});
