'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { WizardStep } from '@/components/ui/WizardStep';
import { Button } from '@rdna/radiants/components/core';
import { AlertTriangle } from '@rdna/radiants/icons';
import { useRadiatorToast } from '@/hooks/useRadiatorToast';

export function ReviewDeploy({ onBack }: { onBack: () => void }) {
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const collectionName = useAppStore((s) => s.adminCollectionName);
  const collection = useAppStore((s) => s.adminCollection);
  const collectionImage = useAppStore((s) => s.adminCollectionImage);
  const nftCount = useAppStore((s) => s.adminNftCount);
  const artItems = useAppStore((s) => s.adminArtItems);
  const revealUpfront = useAppStore((s) => s.adminRevealUpfront);
  const offeringSize = useAppStore((s) => s.adminOfferingSize);
  const symbol = useAppStore((s) => s.adminSymbol);
  const canBurn = useAppStore((s) => s.adminCanBurn);
  const swapFee = useAppStore((s) => s.adminSwapFee);

  const [deploying, setDeploying] = useState(false);
  const toast = useRadiatorToast();

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      // Mock createConfig transaction — 2s delay
      await new Promise((r) => setTimeout(r, 2000));
      toast.deploySuccess();
      setAdminStep('success');
    } catch (err) {
      toast.txError(err instanceof Error ? err : new Error('Deploy failed'));
    } finally {
      setDeploying(false);
    }
  };

  return (
    <WizardStep
      heading="Review Your Radiator"
      description="Confirm everything looks right before deploying"
      onBack={onBack}
      loading={deploying}
    >
      <div className="flex flex-col gap-4">
        {/* Collection summary */}
        <SummaryCard label="Collection">
          <div className="flex items-center gap-3">
            <img
              src={collectionImage}
              alt={collectionName}
              className="w-10 h-10 rounded-sm object-cover"
            />
            <div className="flex flex-col">
              <span className="font-joystix text-xs uppercase text-content-heading">
                {collectionName}
              </span>
              <span className="font-mondwest text-xs text-content-muted">
                {nftCount.toLocaleString()} NFTs &middot; {truncate(collection)}
              </span>
            </div>
          </div>
        </SummaryCard>

        {/* Art summary */}
        <SummaryCard label="Irradiated Art">
          <div className="flex flex-col gap-2">
            <span className="font-mondwest text-sm text-content-secondary">
              {artItems.length} piece{artItems.length !== 1 ? 's' : ''} &middot; Reveal {revealUpfront ? 'upfront' : 'on completion'}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {artItems.slice(0, 8).map((item, i) => (
                <img
                  key={i}
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-10 h-10 rounded-sm object-cover"
                />
              ))}
              {artItems.length > 8 && (
                <div className="w-10 h-10 rounded-sm bg-surface-muted flex items-center justify-center">
                  <span className="font-joystix text-[8px] text-content-muted">
                    +{artItems.length - 8}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SummaryCard>

        {/* Rules summary */}
        <SummaryCard label="Rules">
          <div className="flex flex-col gap-1">
            <Row label="Offering size" value={String(offeringSize)} />
            <Row label="Symbol" value={symbol} />
            <Row label="Gas burns" value={canBurn ? 'Enabled' : 'Disabled'} />
            <Row label="Swap fee" value={`${swapFee} SOL`} />
          </div>
        </SummaryCard>

        {/* Warning */}
        <div className="flex items-center gap-2 p-3 border border-status-warning rounded-sm bg-surface-muted">
          <AlertTriangle size={16} className="text-status-warning shrink-0" />
          <span className="font-mondwest text-sm text-content-secondary">
            Deploying creates an on-chain config. This costs SOL.
          </span>
        </div>

        {/* Deploy button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleDeploy}
          disabled={deploying}
        >
          {deploying ? 'Deploying...' : 'Deploy Radiator'}
        </Button>
      </div>
    </WizardStep>
  );
}

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 p-3 border border-edge-muted rounded-sm">
      <span className="font-joystix text-xs uppercase text-content-muted">{label}</span>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mondwest text-sm text-content-secondary">{label}</span>
      <span className="font-joystix text-xs uppercase text-content-heading">{value}</span>
    </div>
  );
}

function truncate(str: string) {
  if (str.length <= 12) return str;
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}
