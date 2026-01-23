'use client';

import { Divider } from '@/components/ui/Divider';

interface StatsCardProps {
  totalStake?: number;
  percentageOfNetwork?: number;
  epoch?: number;
  validatorCount?: number;
}

export function StatsCard({
  totalStake = 0,
  percentageOfNetwork = 0,
  epoch = 0,
  validatorCount = 0,
}: StatsCardProps) {
  const goalPercentage = 33;

  const formatStake = (stake: number) => {
    if (stake >= 1_000_000) {
      return `${(stake / 1_000_000).toFixed(2)}M`;
    } else if (stake >= 1_000) {
      return `${(stake / 1_000).toFixed(2)}K`;
    }
    return stake.toFixed(0);
  };

  // Calculate progress towards goal (capped at 100%)
  const progressToGoal = Math.min((percentageOfNetwork / goalPercentage) * 100, 100);

  return (
    <div className="border border-black bg-white p-6 md:p-10 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <small className="text-neutral-neutral-3">Total Staked Amount</small>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl md:text-6xl font-semibold font-alfacad">
              {totalStake > 0 ? formatStake(totalStake) : '—'}
            </span>
            <span className="text-2xl md:text-3xl text-neutral-neutral-3">SOL</span>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <small className="text-neutral-neutral-3">Validators</small>
            <div className="text-2xl font-semibold">{validatorCount}</div>
          </div>
          <div>
            <small className="text-neutral-neutral-3">Epoch</small>
            <div className="text-2xl font-semibold">{epoch > 0 ? epoch : '—'}</div>
          </div>
        </div>
      </div>

      <Divider variant="mix-blend" className="my-6" />

      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <small className="text-neutral-neutral-3">Network Stake Progress</small>
          <small className="text-neutral-neutral-3">Goal: {goalPercentage}%</small>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-neutral-neutral-1 overflow-hidden">
          {/* Current progress */}
          <div
            className="absolute inset-y-0 left-0 bg-green transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(percentageOfNetwork, 100)}%` }}
          />
          {/* Goal marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-black"
            style={{ left: `${goalPercentage}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green" />
              <span className="text-sm">
                {percentageOfNetwork.toFixed(2)}% of network
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black" />
              <span className="text-sm">Goal: {goalPercentage}%</span>
            </div>
          </div>
          <span className="text-sm text-neutral-neutral-3">
            {progressToGoal.toFixed(1)}% to goal
          </span>
        </div>
      </div>

      {/* Info Banner */}
      {percentageOfNetwork > 0 && (
        <div className="mt-6 p-4 border border-green bg-green/10">
          <p className="text-sm">
            Layer33 validators control {percentageOfNetwork.toFixed(2)}% of the total
            Solana network stake, securing decentralization.
          </p>
        </div>
      )}
    </div>
  );
}
