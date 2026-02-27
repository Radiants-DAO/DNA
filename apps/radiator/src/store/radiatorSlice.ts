import { StateCreator } from 'zustand';

export interface RadiatorConfig {
  configAccountKey: string;
  collection: string;
  collectionName: string;
  offeringSize: number;
  revealUpfront: boolean;
  totalBurnt: number;
  totalSwaps: number;
}

export interface RadiatorSlice {
  config: RadiatorConfig | null;
  setConfig: (config: RadiatorConfig) => void;
  clearConfig: () => void;
}

export const createRadiatorSlice: StateCreator<RadiatorSlice> = (set) => ({
  config: null,
  setConfig: (config) => set({ config }),
  clearConfig: () => set({ config: null }),
});
