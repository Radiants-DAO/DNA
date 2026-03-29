'use client';

import { useState } from 'react';
import { Button } from '@rdna/radiants/components/core';

const TOOLS = ['inspect', 'comment', 'measure', 'settings'] as const;

export function InspectToolbarRdna() {
  const [active, setActive] = useState<(typeof TOOLS)[number]>('inspect');

  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Toolbar
      </span>

      {/* Floating bar */}
      <div className="inline-flex items-center gap-0.5 bg-card pixel-rounded-sm shadow-floating border border-line px-2 py-1.5">
        {TOOLS.map((tool) => (
          <Button
            key={tool}
            mode="flat"
            size="sm"
            compact
            active={active === tool}
            onClick={() => setActive(tool)}
          >
            {tool}
          </Button>
        ))}
      </div>

      {/* Mode label */}
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Mode: {active}
      </span>
    </div>
  );
}
