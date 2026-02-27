import { StateCreator } from 'zustand';

export type View =
  | 'explainer'
  | 'landing'
  | 'choose-fate'
  | 'seal-claim'
  | 'feed-radiator'
  | 'ignite'
  | 'radiated'
  | 'admin-wizard';

export type AdminStep =
  | 'select-collection'
  | 'upload-art'
  | 'set-rules'
  | 'review-deploy'
  | 'success';

export interface ViewSlice {
  currentView: View;
  adminStep: AdminStep;
  setView: (view: View) => void;
  setAdminStep: (step: AdminStep) => void;
}

export const createViewSlice: StateCreator<ViewSlice> = (set) => ({
  currentView: 'explainer',
  adminStep: 'select-collection',
  setView: (view) => set({ currentView: view }),
  setAdminStep: (step) => set({ adminStep: step }),
});
