import { useEffect, useCallback } from "react";
import { create } from "zustand";
import { open } from "@tauri-apps/plugin-dialog";
import { commands } from "../bindings";
import type { ProjectInfo } from "../bindings";
import { useProjectStore } from "../stores/projectStore";
import { useAppStore } from "../stores/appStore";
import {
  Step1SelectProject,
  Step2InstallBridge,
  Step3ConfigureNextjs,
  Step4StartServer,
} from "./wizard";

// Local wizard state store (not persisted)
type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  active: boolean;
  step: WizardStep;
  project: ProjectInfo | null;
  error: string | null;
  loading: boolean;
  installProgress: string[];
  installComplete: boolean;
  configConfirmed: boolean;
  serverConnecting: boolean;
  serverConnected: boolean;

  // Actions
  setActive: (active: boolean) => void;
  setStep: (step: WizardStep) => void;
  setProject: (project: ProjectInfo | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  addInstallProgress: (line: string) => void;
  setInstallComplete: (complete: boolean) => void;
  setConfigConfirmed: (confirmed: boolean) => void;
  setServerConnecting: (connecting: boolean) => void;
  setServerConnected: (connected: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const useWizardStore = create<WizardState>((set, get) => ({
  active: false,
  step: 1,
  project: null,
  error: null,
  loading: false,
  installProgress: [],
  installComplete: false,
  configConfirmed: false,
  serverConnecting: false,
  serverConnected: false,

  setActive: (active) => set({ active }),
  setStep: (step) => set({ step, error: null }),
  setProject: (project) => set({ project }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  addInstallProgress: (line) =>
    set((state) => ({ installProgress: [...state.installProgress, line] })),
  setInstallComplete: (complete) => set({ installComplete: complete }),
  setConfigConfirmed: (confirmed) => set({ configConfirmed: confirmed }),
  setServerConnecting: (connecting) => set({ serverConnecting: connecting }),
  setServerConnected: (connected) => set({ serverConnected: connected }),
  nextStep: () => {
    const { step } = get();
    if (step < 4) {
      set({ step: (step + 1) as WizardStep, error: null });
    }
  },
  prevStep: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: (step - 1) as WizardStep, error: null });
    }
  },
  reset: () =>
    set({
      active: false,
      step: 1,
      project: null,
      error: null,
      loading: false,
      installProgress: [],
      installComplete: false,
      configConfirmed: false,
      serverConnecting: false,
      serverConnected: false,
    }),
}));

const STEPS = [
  { num: 1, label: "Select Project" },
  { num: 2, label: "Install Bridge" },
  { num: 3, label: "Configure" },
  { num: 4, label: "Connect" },
];

interface FirstRunWizardProps {
  /** Force show wizard even if project is configured */
  forceShow?: boolean;
  /** Called when wizard completes successfully */
  onComplete?: () => void;
  /** Called when wizard is closed/cancelled */
  onClose?: () => void;
}

/**
 * FirstRunWizard - Step-by-step project setup wizard.
 *
 * Guides the user through:
 * 1. Selecting a Next.js project
 * 2. Installing the RadFlow bridge
 * 3. Configuring next.config.js
 * 4. Starting the dev server and verifying connection
 *
 * Implementation: fn-5.7
 */
export function FirstRunWizard({ forceShow, onComplete, onClose }: FirstRunWizardProps) {
  const wizard = useWizardStore();
  const { currentProject } = useProjectStore();
  const detectProject = useAppStore((s) => s.detectProject);

  // Check if wizard should be shown
  useEffect(() => {
    if (forceShow) {
      wizard.setActive(true);
      return;
    }

    // Check if we should skip the wizard
    const checkSkipWizard = async () => {
      if (!currentProject) return;

      // Detect project info
      const result = await commands.detectProject(currentProject.path);

      if (result.success && result.project) {
        // Skip wizard if bridge is already installed and project is Next.js
        if (result.project.hasBridge && result.project.projectType === "nextjs") {
          // Bridge is installed, skip wizard
          wizard.setActive(false);
          return;
        }

        // Project exists but needs setup - show wizard
        if (result.project.projectType === "nextjs") {
          wizard.setActive(true);
          wizard.setProject(result.project);
        }
      }
    };

    checkSkipWizard();
  }, [forceShow, currentProject]);

  // Handle project selection (Step 1)
  const handleProjectSelected = useCallback(
    (project: ProjectInfo) => {
      wizard.setProject(project);
      wizard.nextStep();
    },
    []
  );

  // Handle install complete (Step 2)
  const handleInstallComplete = useCallback(() => {
    wizard.nextStep();
  }, []);

  // Handle config confirmed (Step 3)
  const handleConfigComplete = useCallback(() => {
    wizard.nextStep();
  }, []);

  // Handle wizard complete (Step 4)
  const handleWizardComplete = useCallback(async () => {
    if (wizard.project) {
      // Update the project store with the configured project
      await detectProject(wizard.project.path);
    }

    wizard.reset();
    onComplete?.();
  }, [wizard.project, detectProject, onComplete]);

  // Handle close
  const handleClose = useCallback(() => {
    wizard.reset();
    onClose?.();
  }, [onClose]);

  // Don't render if not active
  if (!wizard.active) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">RadFlow Setup</h1>
          <p className="text-text-muted">
            Let's connect RadFlow to your Next.js project
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    wizard.step >= s.num
                      ? "bg-primary text-white"
                      : "bg-surface text-text-muted"
                  }`}
                >
                  {wizard.step > s.num ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    s.num
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition-colors ${
                      wizard.step > s.num ? "bg-primary" : "bg-surface"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Label */}
        <div className="text-center mb-6">
          <span className="text-xs text-text-muted uppercase tracking-wide">
            Step {wizard.step} of 4: {STEPS[wizard.step - 1].label}
          </span>
        </div>

        {/* Step Content */}
        <div className="bg-surface/50 rounded-xl p-8 border border-white/5">
          {wizard.step === 1 && (
            <Step1SelectProject
              onProjectSelected={handleProjectSelected}
              error={wizard.error}
              setError={wizard.setError}
              loading={wizard.loading}
              setLoading={wizard.setLoading}
            />
          )}

          {wizard.step === 2 && wizard.project && (
            <Step2InstallBridge
              project={wizard.project}
              onComplete={handleInstallComplete}
              onBack={wizard.prevStep}
              progress={wizard.installProgress}
              addProgress={wizard.addInstallProgress}
              complete={wizard.installComplete}
              setComplete={wizard.setInstallComplete}
              error={wizard.error}
              setError={wizard.setError}
            />
          )}

          {wizard.step === 3 && (
            <Step3ConfigureNextjs
              onComplete={handleConfigComplete}
              onBack={wizard.prevStep}
              confirmed={wizard.configConfirmed}
              setConfirmed={wizard.setConfigConfirmed}
            />
          )}

          {wizard.step === 4 && wizard.project && (
            <Step4StartServer
              project={wizard.project}
              onComplete={handleWizardComplete}
              onBack={wizard.prevStep}
              connecting={wizard.serverConnecting}
              setConnecting={wizard.setServerConnecting}
              connected={wizard.serverConnected}
              setConnected={wizard.setServerConnected}
            />
          )}
        </div>

        {/* Close Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleClose}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Cancel and close
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Hook to trigger the wizard from settings or other components.
 */
export function useFirstRunWizard() {
  const setActive = useWizardStore((s) => s.setActive);
  const reset = useWizardStore((s) => s.reset);

  return {
    openWizard: () => {
      reset();
      setActive(true);
    },
    closeWizard: () => {
      reset();
    },
  };
}

export default FirstRunWizard;
