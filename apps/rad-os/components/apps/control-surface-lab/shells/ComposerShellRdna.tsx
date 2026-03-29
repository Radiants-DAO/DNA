'use client';

import { useState } from 'react';
import { Button } from '@rdna/radiants/components/core';

export function ComposerShellRdna() {
  const [message, setMessage] = useState('');

  return (
    <div className="bg-card border border-line pixel-rounded-sm shadow-floating w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-rule">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          Compose
        </span>
        <Button mode="flat" size="sm" iconOnly icon="settings" />
      </div>

      {/* Body */}
      <div className="p-3">
        <textarea
          className="w-full h-20 bg-page border border-rule rounded-sm font-mono text-xs text-main p-2 resize-none outline-none focus:border-accent transition-colors placeholder:text-mute"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Controls slot */}
      <div className="mx-3 border border-dashed border-rule rounded-sm px-3 py-2 flex items-center justify-center">
        <span className="font-mono text-xs text-mute">controls</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-rule mt-3">
        <span className="font-mono text-xs text-mute">
          &#8984;+Enter
        </span>
        <div className="flex gap-1.5">
          <Button mode="flat" size="sm" onClick={() => setMessage('')}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => setMessage('')}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
