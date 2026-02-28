import { create } from 'zustand';
import { ViewSlice, createViewSlice } from './viewSlice';
import { RadiatorSlice, createRadiatorSlice } from './radiatorSlice';
import { BurnSlice, createBurnSlice } from './burnSlice';
import { AdminSlice, createAdminSlice } from './adminSlice';

type AppStore = ViewSlice & RadiatorSlice & BurnSlice & AdminSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createViewSlice(...a),
  ...createRadiatorSlice(...a),
  ...createBurnSlice(...a),
  ...createAdminSlice(...a),
}));

// Dev helper: expose store on window for debugging / visual QA
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__store = useAppStore;
}
