'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useAppStore } from '@/store';
import { StatBadge } from '@/components/ui/StatBadge';
import { ConnectWallet } from '@/components/ui/ConnectWallet';
import { mockRadiators, mockGlobalStats, MockRadiator } from '@/data/mockRadiators';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';

export function Landing() {
  const setView = useAppStore((s) => s.setView);
  const setConfig = useAppStore((s) => s.setConfig);
  const { connected } = useWallet();

  const handleSelectRadiator = (radiator: MockRadiator) => {
    if (!connected) return;
    // Store the mock config so ceremony scenes know offeringSize / revealUpfront
    setConfig({
      configAccountKey: radiator.collection,
      collection: radiator.collection,
      collectionName: radiator.name,
      offeringSize: radiator.offeringSize,
      revealUpfront: radiator.revealUpfront,
      totalBurnt: radiator.totalBurnt,
      totalSwaps: 0,
    });
    setView('choose-fate');
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon name="electric" size={24} className="text-accent" />
          <h1 className="font-joystix text-xl uppercase text-head">
            Radiations
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatBadge
            label="Total NFTs Irradiated:"
            value={mockGlobalStats.totalIrradiated.toLocaleString()}
          />
          <StatBadge
            label="Total Value Burnt:"
            value={`${mockGlobalStats.totalValueBurnt.toLocaleString()} SOL`}
          />
        </div>
      </div>

      {/* Wallet gate */}
      {!connected && (
        <div className="flex flex-col items-center gap-3 py-4 border border-rule pixel-rounded-sm bg-depth">
          <p className="font-mondwest text-sub">
            Connect your wallet to enter a radiator
          </p>
          <ConnectWallet />
        </div>
      )}

      {/* Radiator grid */}
      {mockRadiators.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="font-mondwest text-lg text-mute">
            No active radiators yet
          </p>
        </div>
      ) : (
        <div className="grid @sm:grid-cols-2 @lg:grid-cols-4 gap-4">
          {mockRadiators.map((radiator) => (
            <RadiatorCard
              key={radiator.collection}
              radiator={radiator}
              onClick={() => handleSelectRadiator(radiator)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RadiatorCard({
  radiator,
  onClick,
}: {
  radiator: MockRadiator;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="md"
      onClick={onClick}
      className="
        border border-rule pixel-rounded-lg overflow-hidden cursor-pointer
        hover:border-line-hover
        text-left bg-page
        hover:-translate-y-1 hover:shadow-lifted
        active:-translate-y-0.5 active:shadow-resting
        transition-transform duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
      "
    >
      {/* Collection image */}
      <div className="aspect-square overflow-hidden bg-depth">
        <img
          src={radiator.image}
          alt={radiator.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <span className="font-mondwest text-sm text-head">
          {radiator.name}
        </span>
        <span className="font-joystix text-xs uppercase text-mute">
          {radiator.totalBurnt.toLocaleString()} burned
        </span>
      </div>
    </Button>
  );
}
