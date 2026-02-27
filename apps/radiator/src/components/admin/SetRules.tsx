'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { WizardStep } from '@/components/ui/WizardStep';
import { Input, Label, Switch } from '@rdna/radiants/components/core';
import { ChevronDown } from '@rdna/radiants/icons';

export function SetRules({ onBack }: { onBack: () => void }) {
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const offeringSize = useAppStore((s) => s.adminOfferingSize);
  const setOfferingSize = useAppStore((s) => s.setAdminOfferingSize);
  const canBurn = useAppStore((s) => s.adminCanBurn);
  const setCanBurn = useAppStore((s) => s.setAdminCanBurn);
  const symbol = useAppStore((s) => s.adminSymbol);
  const setSymbol = useAppStore((s) => s.setAdminSymbol);
  const swapFee = useAppStore((s) => s.adminSwapFee);
  const setSwapFee = useAppStore((s) => s.setAdminSwapFee);

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <WizardStep
      heading="Set Radiation Rules"
      description="Configure how the radiator works"
      onBack={onBack}
      onNext={() => setAdminStep('review-deploy')}
      nextDisabled={offeringSize < 1 || !symbol.trim()}
    >
      <div className="flex flex-col gap-5">
        {/* Offering size */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-joystix text-xs uppercase text-content-muted">
            Offering size
          </Label>
          <Input
            type="number"
            value={String(offeringSize)}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 20) setOfferingSize(v);
            }}
            fullWidth
          />
          <span className="font-mondwest text-xs text-content-muted">
            How many NFTs must be sacrificed (including the primary). Min 1, max 20.
          </span>
        </div>

        {/* Symbol */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-joystix text-xs uppercase text-content-muted">
            NFT symbol
          </Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.slice(0, 10))}
            placeholder="RAD"
            fullWidth
          />
          <span className="font-mondwest text-xs text-content-muted">
            Max 10 characters
          </span>
        </div>

        {/* Burn toggle */}
        <Switch
          checked={canBurn}
          onChange={setCanBurn}
          label="Allow gas burns"
        />

        {/* Advanced — collapsible */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 font-joystix text-xs uppercase text-content-secondary hover:text-content-heading"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Advanced settings
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-4 pl-4 border-l border-edge-muted">
            <div className="flex flex-col gap-1.5">
              <Label className="font-joystix text-xs uppercase text-content-muted">
                Swap fee (SOL)
              </Label>
              <Input
                type="number"
                value={String(swapFee)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0) setSwapFee(v);
                }}
                fullWidth
              />
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
