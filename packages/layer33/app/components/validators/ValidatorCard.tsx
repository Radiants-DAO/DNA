'use client';

import { useState } from 'react';
import { Divider } from '@/components/ui/Divider';
import type { ValidatorWithStake } from '@/lib/validators/types';

interface ValidatorCardProps {
  validator: ValidatorWithStake;
}

export function ValidatorCard({ validator }: ValidatorCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateKey = (key: string) => {
    if (!key) return '—';
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  const formatStake = (stake: number) => {
    if (stake >= 1_000_000) {
      return `${(stake / 1_000_000).toFixed(2)}M SOL`;
    } else if (stake >= 1_000) {
      return `${(stake / 1_000).toFixed(1)}K SOL`;
    }
    return `${stake.toFixed(0)} SOL`;
  };

  const getLocationString = () => {
    if (validator.city && validator.country) {
      return `${validator.city}, ${validator.country}`;
    }
    return validator.location || validator.country || '—';
  };

  // Determine status color based on skip rate
  const getStatusColor = () => {
    if (!validator.skipRate) return 'bg-neutral-neutral-3';
    const skipNum = parseFloat(validator.skipRate);
    if (skipNum < 1) return 'bg-green';
    if (skipNum < 5) return 'bg-blue';
    return 'bg-accent-2';
  };

  return (
    <div className="border border-black bg-white p-4 hover:bg-neutral-neutral-1 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar/Icon */}
          <div className="w-10 h-10 bg-black flex items-center justify-center flex-shrink-0 overflow-hidden">
            {validator.iconUrl ? (
              <img
                src={validator.iconUrl}
                alt={validator.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-white text-lg font-bold">${validator.displayName.charAt(0).toUpperCase()}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-white text-lg font-bold">
                {validator.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-base font-semibold leading-tight m-0">
              {validator.displayName}
            </h4>
            <div className="text-xs text-neutral-neutral-3 uppercase">
              {getLocationString()}
            </div>
          </div>
        </div>
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 ${getStatusColor()}`} />
          <span className="text-xs text-neutral-neutral-3 uppercase">Active</span>
        </div>
      </div>

      <Divider variant="mix-blend" className="my-3" />

      {/* Keys Section */}
      <div className="space-y-2 mb-3">
        {/* Identity Key */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-neutral-3 uppercase">Identity</span>
          <button
            onClick={() => handleCopy(validator.identityKey, 'identity')}
            className="flex items-center gap-1 font-mono text-xs hover:text-green transition-colors"
            title="Click to copy"
          >
            <span>{truncateKey(validator.identityKey)}</span>
            {copiedField === 'identity' ? (
              <span className="text-green">✓</span>
            ) : (
              <span className="text-neutral-neutral-3 opacity-0 group-hover:opacity-100 transition-opacity">⧉</span>
            )}
          </button>
        </div>
        {/* Vote Account */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-neutral-3 uppercase">Vote</span>
          <button
            onClick={() => handleCopy(validator.voteAccount, 'vote')}
            className="flex items-center gap-1 font-mono text-xs hover:text-blue transition-colors"
            title="Click to copy"
          >
            <span>{truncateKey(validator.voteAccount)}</span>
            {copiedField === 'vote' ? (
              <span className="text-green">✓</span>
            ) : (
              <span className="text-neutral-neutral-3 opacity-0 group-hover:opacity-100 transition-opacity">⧉</span>
            )}
          </button>
        </div>
      </div>

      <Divider variant="mix-blend" className="my-3" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {/* Stake */}
        <div>
          <span className="text-xs text-neutral-neutral-3 uppercase block">Stake</span>
          <span className="text-sm font-semibold text-green">
            {validator.activatedStake > 0 ? formatStake(validator.activatedStake) : '—'}
          </span>
        </div>
        {/* Network % */}
        <div>
          <span className="text-xs text-neutral-neutral-3 uppercase block">Network</span>
          <span className="text-sm font-semibold">
            {validator.stakePercentage > 0
              ? `${validator.stakePercentage.toFixed(3)}%`
              : '—'}
          </span>
        </div>
        {/* APY */}
        <div>
          <span className="text-xs text-neutral-neutral-3 uppercase block">APY</span>
          <span className="text-sm font-semibold text-blue">
            {validator.apy !== undefined ? `${validator.apy.toFixed(2)}%` : '—'}
          </span>
        </div>
        {/* Commission */}
        <div>
          <span className="text-xs text-neutral-neutral-3 uppercase block">Commission</span>
          <span className="text-sm font-semibold">
            {validator.commission !== undefined ? `${validator.commission}%` : '—'}
          </span>
        </div>
        {/* Skip Rate */}
        <div>
          <span className="text-xs text-neutral-neutral-3 uppercase block">Skip Rate</span>
          <span className="text-sm font-semibold">
            {validator.skipRate || '—'}
          </span>
        </div>
        {/* Blocks */}
        <div>
          <span className="text-xs text-neutral-neutral-3 uppercase block">Blocks</span>
          <span className="text-sm font-semibold">
            {validator.blocksProduced?.toLocaleString() || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
