'use client';

import { Button } from '@rdna/radiants/components/core';

interface WizardStepProps {
  heading: string;
  description?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export function WizardStep({
  heading,
  description,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
  loading,
}: WizardStepProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-joystix text-xl uppercase text-head">
          {heading}
        </h2>
        {description && (
          <p className="font-mondwest text-sub">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-rule">
        {onBack ? (
          <Button variant="ghost" size="md" onClick={onBack} disabled={loading}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {onNext && (
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
            disabled={nextDisabled || loading}
          >
            {loading ? 'Loading...' : nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
