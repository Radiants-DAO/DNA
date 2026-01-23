'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { StakingPosition } from '@/app/staking/types';

// ============================================================================
// Types
// ============================================================================

interface StakingPositionCardProps {
  position: StakingPosition;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function StakingPositionCard({ position, className = '' }: StakingPositionCardProps) {
  return (
    <Card variant="default" className={className} disableHover>
      <CardHeader>
        <Label className="caption uppercase">Your Staking Position</Label>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4">
          {/* Staked Amount */}
          <div className="flex flex-col gap-1">
            <Label className="caption uppercase text-black/60">Staked Amount</Label>
            <div className="font-alfacad text-xl font-medium">
              {position.stakedAmount} SOL
            </div>
          </div>

          {/* Received Tokens */}
          <div className="flex flex-col gap-1">
            <Label className="caption uppercase text-black/60">Received Tokens</Label>
            <div className="font-alfacad text-xl font-medium">
              {position.receivedTokens} INDIESOL
            </div>
          </div>

          {/* Rewards */}
          <div className="flex flex-col gap-1">
            <Label className="caption uppercase text-black/60">Current Rewards</Label>
            <div className="font-alfacad text-xl font-medium text-green">
              {position.rewards} INDIESOL
            </div>
          </div>

          {/* APY */}
          <div className="flex flex-col gap-1">
            <Label className="caption uppercase text-black/60">APY</Label>
            <div className="font-alfacad text-xl font-medium">
              {position.apy}%
            </div>
          </div>

          {/* Unstake Button (for future implementation) */}
          <div className="pt-2">
            <Button
              variant="outline"
              fullWidth
              disabled
              style={{ justifyContent: 'center' }}
            >
              UNSTAKE (COMING SOON)
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
