'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@rdna/radiants/components/core';
import { Zap, AlertTriangle } from '@rdna/radiants/icons';

export function SealClaim() {
  const setView = useAppStore((s) => s.setView);
  const primaryNFT = useAppStore((s) => s.primaryNFT);
  const rewardPreview = useAppStore((s) => s.rewardPreview);
  const config = useAppStore((s) => s.config);
  const setEntangledPair = useAppStore((s) => s.setEntangledPair);

  const [sealing, setSealing] = useState(false);

  const offeringSize = config?.offeringSize ?? 3;
  const gasRequired = offeringSize - 1;

  const handleSeal = async () => {
    setSealing(true);
    // Mock createClaim transaction — 1.5s delay
    await new Promise((r) => setTimeout(r, 1500));
    setEntangledPair('MockEntangled...Pair');
    setSealing(false);
    setView('feed-radiator');
  };

  if (!primaryNFT) {
    setView('choose-fate');
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 h-full text-center">
      {/* Selected NFT preview */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-32 h-32 border border-edge-primary rounded-sm overflow-hidden">
            <img
              src={primaryNFT.image}
              alt={primaryNFT.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-joystix text-xs uppercase text-content-heading">
            {primaryNFT.name}
          </span>
        </div>

        {/* Arrow / radiation icon */}
        {rewardPreview && (
          <>
            <Zap size={32} className="text-action-primary shrink-0" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-32 border border-edge-focus rounded-sm overflow-hidden">
                <img
                  src={rewardPreview.image}
                  alt={rewardPreview.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-joystix text-xs uppercase text-content-heading">
                {rewardPreview.name}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h1 className="font-joystix text-xl uppercase text-content-heading">
          Your fate is about to be sealed
        </h1>
        {gasRequired > 0 && (
          <p className="font-mondwest text-content-secondary">
            This radiation requires {gasRequired} additional sacrifice{gasRequired > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Warning */}
      <div className="flex items-center gap-2 text-status-error">
        <AlertTriangle size={16} />
        <span className="font-mondwest text-sm">
          This action cannot be undone
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="md"
          onClick={() => setView('choose-fate')}
          disabled={sealing}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSeal}
          disabled={sealing}
        >
          {sealing ? 'Sealing...' : 'Seal It'}
        </Button>
      </div>
    </div>
  );
}
