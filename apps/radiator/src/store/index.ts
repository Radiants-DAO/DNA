import { create } from 'zustand';
import { ViewSlice, createViewSlice } from './viewSlice';
import { RadiatorSlice, createRadiatorSlice } from './radiatorSlice';
import { BurnSlice, createBurnSlice } from './burnSlice';

type AppStore = ViewSlice & RadiatorSlice & BurnSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createViewSlice(...a),
  ...createRadiatorSlice(...a),
  ...createBurnSlice(...a),
}));
