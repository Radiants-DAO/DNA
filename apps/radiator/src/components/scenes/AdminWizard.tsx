'use client';

import { useAppStore } from '@/store';
import { Check } from '@rdna/radiants/icons';
import type { AdminStep } from '@/store/viewSlice';

const steps: { key: AdminStep; label: string }[] = [
  { key: 'select-collection', label: 'Collection' },
  { key: 'upload-art', label: 'Art' },
  { key: 'set-rules', label: 'Rules' },
  { key: 'review-deploy', label: 'Deploy' },
  { key: 'success', label: 'Done' },
];

function stepIndex(step: AdminStep): number {
  return steps.findIndex((s) => s.key === step);
}

export function AdminWizard() {
  const adminStep = useAppStore((s) => s.adminStep);
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const setView = useAppStore((s) => s.setView);

  const currentIdx = stepIndex(adminStep);

  const handleBack = () => {
    if (currentIdx === 0) {
      setView('landing');
    } else {
      setAdminStep(steps[currentIdx - 1].key);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 h-full">
      {/* Step indicator bar */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const isComplete = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full shrink-0
                  font-joystix text-[8px]
                  ${isComplete
                    ? 'bg-action-primary text-content-inverted'
                    : isCurrent
                      ? 'border-2 border-action-primary text-action-primary'
                      : 'border border-edge-muted text-content-muted'
                  }
                `}
              >
                {isComplete ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`
                  font-joystix text-[8px] uppercase hidden @sm:block
                  ${isCurrent ? 'text-content-heading' : 'text-content-muted'}
                `}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 ${
                    isComplete ? 'bg-action-primary' : 'bg-edge-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <StepContent step={adminStep} onBack={handleBack} />
      </div>
    </div>
  );
}

/** Renders the current admin step — placeholder for now, real steps in Tasks 4.2-4.6 */
function StepContent({ step, onBack }: { step: AdminStep; onBack: () => void }) {
  const setAdminStep = useAppStore((s) => s.setAdminStep);

  const nextStep = (): AdminStep | null => {
    const idx = stepIndex(step);
    return idx < steps.length - 1 ? steps[idx + 1].key : null;
  };

  const next = nextStep();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="font-joystix text-lg uppercase text-content-heading">
        {steps[stepIndex(step)]?.label}
      </h2>
      <p className="font-mondwest text-content-muted">Step placeholder</p>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="font-joystix text-xs uppercase text-content-secondary hover:text-content-heading"
        >
          Back
        </button>
        {next && (
          <button
            onClick={() => setAdminStep(next)}
            className="font-joystix text-xs uppercase text-action-primary hover:underline"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
