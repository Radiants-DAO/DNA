'use client';

import { useAppStore } from '@/store';
import { StatBadge } from '@/components/ui/StatBadge';
import { mockRadiators, mockGlobalStats, MockRadiator } from '@/data/mockRadiators';
import { Zap } from '@rdna/radiants/icons';

export function Landing() {
  const setView = useAppStore((s) => s.setView);

  const handleSelectRadiator = (radiator: MockRadiator) => {
    // In production, this would load the on-chain config
    setView('choose-fate');
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-action-primary" />
          <h1 className="font-joystix text-xl uppercase text-content-heading">
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

      {/* Radiator grid */}
      {mockRadiators.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="font-mondwest text-lg text-content-muted">
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
    <button
      onClick={onClick}
      className="
        border border-edge-primary rounded-sm overflow-hidden cursor-pointer
        text-left bg-surface-primary
        hover:-translate-y-1 hover:shadow-lifted
        active:-translate-y-0.5 active:shadow-resting
        transition-transform duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
      "
    >
      {/* Collection image */}
      <div className="aspect-square overflow-hidden bg-surface-muted">
        <img
          src={radiator.image}
          alt={radiator.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <span className="font-joystix text-sm uppercase text-content-heading">
          {radiator.name}
        </span>
        <span className="font-mondwest text-sm text-content-muted">
          {radiator.totalBurnt.toLocaleString()} burned
        </span>
      </div>
    </button>
  );
}
