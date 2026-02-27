'use client';

import { useAppStore } from '@/store';
import { Check } from '@rdna/radiants/icons';
import type { AdminStep } from '@/store/viewSlice';
import { SelectCollection } from '@/components/admin/SelectCollection';
import { UploadArt } from '@/components/admin/UploadArt';
import { SetRules } from '@/components/admin/SetRules';
import { ReviewDeploy } from '@/components/admin/ReviewDeploy';
import { DeploySuccess } from '@/components/admin/DeploySuccess';

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

function StepContent({ step, onBack }: { step: AdminStep; onBack: () => void }) {
  switch (step) {
    case 'select-collection':
      return <SelectCollection onBack={onBack} />;
    case 'upload-art':
      return <UploadArt onBack={onBack} />;
    case 'set-rules':
      return <SetRules onBack={onBack} />;
    case 'review-deploy':
      return <ReviewDeploy onBack={onBack} />;
    case 'success':
      return <DeploySuccess />;
  }
}
