import type { StateCreator } from "zustand";
import type { AppState, ComponentsSlice } from "../types";
import { commands, type ComponentInfo } from "../../bindings";

export const createComponentsSlice: StateCreator<
  AppState,
  [],
  [],
  ComponentsSlice
> = (set) => ({
  components: [],
  componentsLoading: false,
  componentsError: null,
  componentMap: new Map(),

  scanComponents: async (dir) => {
    set({ componentsLoading: true, componentsError: null });

    const result = await commands.scanComponents(dir);

    if (result.status === "ok") {
      // Build lookup map: file:line -> component
      const componentMap = new Map<string, ComponentInfo>();
      for (const comp of result.data) {
        const key = `${comp.file}:${comp.line}`;
        componentMap.set(key, comp);
      }

      set({
        components: result.data,
        componentMap,
        componentsLoading: false,
      });
    } else {
      set({ componentsError: result.error, componentsLoading: false });
    }
  },

  clearComponents: () =>
    set({ components: [], componentMap: new Map(), componentsError: null }),
});
