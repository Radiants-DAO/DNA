'use client';

import { useState } from 'react';
import { Button, Badge } from '@rdna/radiants/components/core';

type Mode = 'view' | 'resolve' | 'dismiss';

export function AnnotationDetailRdna() {
  const [mode, setMode] = useState<Mode>('view');

  return (
    <div className="bg-card border border-line pixel-rounded-sm shadow-floating w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-rule">
        <Badge variant="success" size="sm">
          fix
        </Badge>
        <Badge variant="warning" size="sm">
          P2
        </Badge>
        <div className="flex-1" />
        <Button mode="flat" size="sm" iconOnly icon="x" />
      </div>

      {/* Message */}
      <div className="px-3 py-3">
        <p className="font-mono text-xs text-main leading-relaxed">
          Border radius should use radius-sm token instead of a hardcoded 4px
          value. This ensures consistency across all themes and respects the
          design system contract.
        </p>
      </div>

      {/* Metadata */}
      <div className="px-3 pb-2">
        <span className="font-mono text-xs text-mute">
          5m ago &middot; {mode === 'view' ? 'pending' : mode}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-rule">
        {mode === 'view' ? (
          <>
            <Button
              mode="flat"
              size="sm"
              onClick={() => setMode('resolve')}
            >
              Resolve
            </Button>
            <Button
              mode="flat"
              size="sm"
              onClick={() => setMode('dismiss')}
              className="text-mute"
            >
              Dismiss
            </Button>
          </>
        ) : (
          <>
            <span className="font-mono text-xs text-accent">
              {mode === 'resolve' ? 'Resolved' : 'Dismissed'}
            </span>
            <div className="flex-1" />
            <Button
              mode="flat"
              size="sm"
              onClick={() => setMode('view')}
              className="text-mute"
            >
              Undo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
