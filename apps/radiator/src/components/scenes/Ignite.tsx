'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@rdna/radiants/components/core';
import { Progress } from '@rdna/radiants/components/core';
import { Zap } from '@rdna/radiants/icons';

const stages = [
  { pct: 0, label: 'Initiating radiation...' },
  { pct: 33, label: 'Burning original...' },
  { pct: 66, label: 'Minting tombstone...' },
  { pct: 100, label: 'Transferring your radNFT...' },
];

export function Ignite() {
  const setView = useAppStore((s) => s.setView);
  const primaryNFT = useAppStore((s) => s.primaryNFT);

  const [stageIdx, setStageIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runSwap() {
      // Simulate staged progress
      for (let i = 1; i < stages.length; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        if (cancelled) return;
        setStageIdx(i);
      }
      // Dramatic pause at 100%
      await new Promise((r) => setTimeout(r, 1500));
      if (cancelled) return;
      setView('radiated');
    }

    runSwap().catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = stages[stageIdx];

  if (!primaryNFT) {
    setView('choose-fate');
    return null;
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-6 h-full text-center">
        <Zap size={48} className="text-status-error" />
        <h1 className="font-joystix text-xl uppercase text-content-heading">
          Radiation Failed
        </h1>
        <p className="font-mondwest text-content-secondary">
          The swap transaction could not be completed
        </p>
        <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 h-full text-center">
      {/* Radiation icon — animated pulse */}
      <div className="animate-pulse">
        <Zap size={64} className="text-action-primary" />
      </div>

      {/* Title */}
      <h1 className="font-joystix text-3xl uppercase text-content-heading">
        Radiating
      </h1>

      {/* Percentage */}
      <span className="font-joystix text-lg uppercase text-content-heading">
        {current.pct}% Complete
      </span>

      {/* Progress bar */}
      <div className="w-full max-w-[24rem]">
        <Progress
          value={current.pct}
          max={100}
          size="lg"
          variant={current.pct === 100 ? 'success' : 'default'}
        />
      </div>

      {/* Stage label */}
      <p className="font-mondwest text-content-secondary">
        {current.label}
      </p>
    </div>
  );
}
