import type { StateCreator } from "zustand";
import type { AppState, ComponentsSlice } from "../types";
import { commands, type ComponentInfo } from "../../bindings";
import type { ComponentMeta } from "../../types/componentMeta";
import {
  generateComponentMeta,
  createComponentMetaMap,
} from "../../utils/generateComponentMeta";

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

      // Generate ComponentMeta for each component
      const componentMetas = result.data.map(generateComponentMeta);

      // Build ComponentMeta lookup map: file:line -> ComponentMeta
      const componentMetaMap = createComponentMetaMap(result.data);

      set({
        components: result.data,
        componentMetas,
        componentMap,
        componentMetaMap,
        componentsLoading: false,
      });
    } else {
      set({ componentsError: result.error, componentsLoading: false });
    }
  },

  clearComponents: () =>
    set({
      components: [],
      componentMetas: [],
      componentMap: new Map(),
      componentMetaMap: new Map(),
      componentsError: null,
    }),

  getComponentMeta: (fileLineKey: string): ComponentMeta | undefined => {
    return get().componentMetaMap.get(fileLineKey);
  },

  getComponentMetaByName: (name: string): ComponentMeta | undefined => {
    return get().componentMetas.find((meta) => meta.name === name);
  },
});
