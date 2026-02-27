'use client';

import { Progress } from '@rdna/radiants/components/core';

interface FuelGaugeProps {
  realized: number;
  required: number;
}

export function FuelGauge({ realized, required }: FuelGaugeProps) {
  const remaining = required - realized;
  const isFull = remaining <= 0;

  return (
    <div className="flex flex-col gap-2 p-4 border border-edge-primary rounded-sm bg-surface-muted">
      <div className="flex items-center justify-between">
        <span className="font-joystix text-xs uppercase text-content-heading">
          Fuel Level
        </span>
        <span className="font-joystix text-xs uppercase text-content-muted">
          {realized} / {required}
        </span>
      </div>
      <Progress
        value={realized}
        max={required}
        variant={isFull ? 'success' : 'default'}
        size="lg"
      />
      <span className="font-mondwest text-sm text-content-secondary">
        {isFull
          ? 'Radiator is fully fueled'
          : `${remaining} more sacrifice${remaining > 1 ? 's' : ''} needed`
        }
      </span>
    </div>
  );
}
