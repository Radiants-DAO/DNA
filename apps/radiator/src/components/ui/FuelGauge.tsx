'use client';

import { Meter } from '@rdna/radiants/components/core';

interface FuelGaugeProps {
  realized: number;
  required: number;
}

export function FuelGauge({ realized, required }: FuelGaugeProps) {
  const remaining = required - realized;
  const isFull = remaining <= 0;

  return (
    <div className="flex flex-col gap-2 p-4 border border-line pixel-rounded-sm bg-depth">
      <div className="flex items-center justify-between">
        <span className="font-joystix text-xs uppercase text-head">
          Fuel Level
        </span>
        <span className="font-joystix text-xs uppercase text-mute">
          {realized} / {required}
        </span>
      </div>
      <Meter
        value={realized}
        max={required}
      />
      <span className="font-mondwest text-sm text-sub">
        {isFull
          ? 'Radiator is fully fueled'
          : `${remaining} more sacrifice${remaining > 1 ? 's' : ''} needed`
        }
      </span>
    </div>
  );
}
