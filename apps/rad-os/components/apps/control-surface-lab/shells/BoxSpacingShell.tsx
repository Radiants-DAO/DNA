'use client';

import { useState } from 'react';
import { Switch } from '@rdna/radiants/components/core';

interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function BoxSpacingShell() {
  const [linked, setLinked] = useState(true);
  const [margin, setMargin] = useState<Sides>({ top: 16, right: 16, bottom: 16, left: 16 });
  const [padding, setPadding] = useState<Sides>({ top: 12, right: 12, bottom: 12, left: 12 });
  const [gap, setGap] = useState(8);

  const updateSides = (
    setter: React.Dispatch<React.SetStateAction<Sides>>,
    side: keyof Sides,
    val: string
  ) => {
    const num = parseInt(val) || 0;
    if (linked) {
      setter({ top: num, right: num, bottom: num, left: num });
    } else {
      setter((prev) => ({ ...prev, [side]: num }));
    }
  };

  const sideInput = (
    value: number,
    setter: React.Dispatch<React.SetStateAction<Sides>>,
    side: keyof Sides,
    className = ''
  ) => (
    <input
      className={`w-6 bg-transparent font-mono text-xs text-mute text-center outline-none focus:text-main transition-colors ${className}`}
      value={value}
      onChange={(e) => updateSides(setter, side, e.target.value)}
    />
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Section label */}
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Spacing
      </span>

      {/* Box model */}
      <div className="relative border border-dashed border-rule pixel-rounded-sm p-1">
        {/* Margin label */}
        <span className="absolute top-0.5 left-1.5 font-mono text-xs text-mute">
          margin
        </span>

        {/* Margin values */}
        <div className="flex justify-center pt-3 pb-0.5">
          {sideInput(margin.top, setMargin, 'top')}
        </div>

        <div className="flex items-center">
          {sideInput(margin.left, setMargin, 'left')}

          {/* Padding zone */}
          <div className="flex-1 bg-hover/10 pixel-rounded-sm p-1 relative mx-1">
            <span className="absolute top-0.5 left-1.5 font-mono text-xs text-mute">
              padding
            </span>

            <div className="flex justify-center pt-3 pb-0.5">
              {sideInput(padding.top, setPadding, 'top')}
            </div>

            <div className="flex items-center">
              {sideInput(padding.left, setPadding, 'left')}

              {/* Content zone */}
              <div className="flex-1 bg-accent/10 pixel-rounded-sm py-3 mx-1 flex items-center justify-center">
                <span className="font-mono text-xs text-accent">240 &times; 120</span>
              </div>

              {sideInput(padding.right, setPadding, 'right')}
            </div>

            <div className="flex justify-center pt-0.5 pb-1">
              {sideInput(padding.bottom, setPadding, 'bottom')}
            </div>
          </div>

          {sideInput(margin.right, setMargin, 'right')}
        </div>

        <div className="flex justify-center pt-0.5 pb-1">
          {sideInput(margin.bottom, setMargin, 'bottom')}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Switch
          size="sm"
          checked={linked}
          onChange={setLinked}
          label="Link"
        />
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-mute">gap</span>
          <input
            className="w-6 bg-transparent font-mono text-xs text-mute text-center outline-none focus:text-main transition-colors"
            value={gap}
            onChange={(e) => setGap(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}
