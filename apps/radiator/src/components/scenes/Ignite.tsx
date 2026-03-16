'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@rdna/radiants/components/core';
import { Meter } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';
import { useRadiatorToast } from '@/hooks/useRadiatorToast';
import { createRadiatorClient } from '@/lib/radiator-client';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const stages = [
  { pct: 0, label: 'Initiating radiation...' },
  { pct: 33, label: 'Burning original...' },
  { pct: 66, label: 'Minting tombstone...' },
  { pct: 100, label: 'Transferring your radNFT...' },
];

export function Ignite() {
  const setView = useAppStore((s) => s.setView);
  const config = useAppStore((s) => s.config);
  const primaryNFT = useAppStore((s) => s.primaryNFT);
  const entangledPair = useAppStore((s) => s.entangledPair);
  const mintB = useAppStore((s) => s.mintB);
  const tokenAccountA = useAppStore((s) => s.tokenAccountA);
  const escrowAccountB = useAppStore((s) => s.escrowAccountB);

  const [stageIdx, setStageIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const toast = useRadiatorToast();
  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    let cancelled = false;

    async function runSwap() {
      if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Connect wallet before igniting');
      }
      if (!config?.configAccountKey || !primaryNFT || !entangledPair || !mintB || !tokenAccountA || !escrowAccountB) {
        throw new Error('Missing swap context');
      }

      // Simulate staged progress
      for (let i = 1; i < stages.length; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        if (cancelled) return;
        setStageIdx(i);
      }

      const client = await createRadiatorClient(connection, wallet);
      const signature = await client.swap({
        configAccountKey: config.configAccountKey,
        mintA: primaryNFT.mint,
        mintB,
        entangledPair,
        tokenAccountA,
        escrowAccountB,
      });

      // Dramatic pause after tx returns
      await new Promise((r) => setTimeout(r, 900));
      if (cancelled) return;
      toast.txSuccess(signature);
      toast.swapComplete();
      setView('radiated');
    }

    runSwap().catch((err) => {
      if (!cancelled) {
        setFailed(true);
        toast.txError(err instanceof Error ? err : new Error('Swap failed'));
      }
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
        <Icon name="electric" size={48} className="text-danger" />
        <h1 className="font-joystix text-xl uppercase text-head">
          Radiation Failed
        </h1>
        <p className="font-mondwest text-sub">
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
        <Icon name="electric" size={64} className="text-accent" />
      </div>

      {/* Title */}
      <h1 className="font-joystix text-3xl uppercase text-head">
        Radiating
      </h1>

      {/* Percentage */}
      <span className="font-joystix text-lg uppercase text-head">
        {current.pct}% Complete
      </span>

      {/* Progress bar */}
      <div className="w-full max-w-[24rem]">
        <Meter
          value={current.pct}
          max={100}
        />
      </div>

      {/* Stage label */}
      <p className="font-mondwest text-sub">
        {current.label}
      </p>
    </div>
  );
}
