'use client';

import { Badge } from '@rdna/radiants/components/core';

export function AnnotationPinRdna() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Pins
      </span>

      <div className="flex items-center gap-3">
        {/* Numbered pin */}
        <div className="w-5 h-5 pixel-rounded-sm bg-accent text-accent-inv font-mono text-xs flex items-center justify-center border border-line cursor-pointer hover:ring-1 ring-accent/30 transition">
          1
        </div>

        {/* Numbered pin 2 */}
        <div className="w-5 h-5 pixel-rounded-sm bg-accent text-accent-inv font-mono text-xs flex items-center justify-center border border-line cursor-pointer hover:ring-1 ring-accent/30 transition">
          2
        </div>

        {/* P1 priority pin */}
        <div className="w-5 h-5 pixel-rounded-sm bg-danger text-inv font-mono text-xs flex items-center justify-center border border-line cursor-pointer hover:ring-1 ring-accent/30 transition">
          !
        </div>

        {/* P2 priority pin */}
        <div className="w-5 h-5 pixel-rounded-sm bg-warning text-inv font-mono text-xs flex items-center justify-center border border-line cursor-pointer hover:ring-1 ring-accent/30 transition">
          !!
        </div>

        {/* Intent badge pin */}
        <Badge variant="default" size="sm">
          <span className="font-mono text-xs cursor-pointer">fix</span>
        </Badge>

        {/* Stacked pin with dot */}
        <div className="relative cursor-pointer hover:ring-1 ring-accent/30 transition rounded-sm">
          <div className="w-5 h-5 pixel-rounded-sm bg-accent text-accent-inv font-mono text-xs flex items-center justify-center border border-line">
            3
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger rounded-full border border-card" />
        </div>
      </div>
    </div>
  );
}
