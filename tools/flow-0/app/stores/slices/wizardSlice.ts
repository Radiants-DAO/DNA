import type { StateCreator } from "zustand";
import type { ProjectInfo } from "../../bindings";

export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardSlice {
  // Wizard state
  wizardActive: boolean;
  wizardStep: WizardStep;
  wizardProject: ProjectInfo | null;
  wizardError: string | null;
  wizardLoading: boolean;

  // Step 2: Install progress
  installProgress: string[];
  installComplete: boolean;

  // Step 3: Config confirmed
  configConfirmed: boolean;

  // Step 4: Server connection
  serverConnecting: boolean;
  serverConnected: boolean;

  // Actions
  startWizard: () => void;
  closeWizard: () => void;
  setWizardStep: (step: WizardStep) => void;
  setWizardProject: (project: ProjectInfo | null) => void;
  setWizardError: (error: string | null) => void;
  setWizardLoading: (loading: boolean) => void;
  addInstallProgress: (line: string) => void;
  setInstallComplete: (complete: boolean) => void;
  setConfigConfirmed: (confirmed: boolean) => void;
  setServerConnecting: (connecting: boolean) => void;
  setServerConnected: (connected: boolean) => void;
  resetWizardState: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const initialWizardState = {
  wizardActive: false,
  wizardStep: 1 as WizardStep,
  wizardProject: null,
  wizardError: null,
  wizardLoading: false,
  installProgress: [],
  installComplete: false,
  configConfirmed: false,
  serverConnecting: false,
  serverConnected: false,
};

export const createWizardSlice: StateCreator<WizardSlice, [], [], WizardSlice> = (
  set,
  get
) => ({
  ...initialWizardState,

  startWizard: () => {
    set({
      ...initialWizardState,
      wizardActive: true,
    });
  },

  closeWizard: () => {
    set({ wizardActive: false });
  },

  setWizardStep: (step) => {
    set({ wizardStep: step, wizardError: null });
  },

  setWizardProject: (project) => {
    set({ wizardProject: project });
  },

  setWizardError: (error) => {
    set({ wizardError: error });
  },

  setWizardLoading: (loading) => {
    set({ wizardLoading: loading });
  },

  addInstallProgress: (line) => {
    const { installProgress } = get();
    set({ installProgress: [...installProgress, line] });
  },

  setInstallComplete: (complete) => {
    set({ installComplete: complete });
  },

  setConfigConfirmed: (confirmed) => {
    set({ configConfirmed: confirmed });
  },

  setServerConnecting: (connecting) => {
    set({ serverConnecting: connecting });
  },

  setServerConnected: (connected) => {
    set({ serverConnected: connected });
  },

  resetWizardState: () => {
    set(initialWizardState);
  },

  nextStep: () => {
    const { wizardStep } = get();
    if (wizardStep < 4) {
      set({ wizardStep: (wizardStep + 1) as WizardStep, wizardError: null });
    }
  },

  prevStep: () => {
    const { wizardStep } = get();
    if (wizardStep > 1) {
      set({ wizardStep: (wizardStep - 1) as WizardStep, wizardError: null });
    }
  },
});
