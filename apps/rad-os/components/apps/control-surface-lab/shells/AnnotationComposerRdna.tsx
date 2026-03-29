'use client';

import { useState } from 'react';
import { Button, Badge } from '@rdna/radiants/components/core';

const INTENTS = ['fix', 'change', 'question', 'create'] as const;
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;

const priorityVariant = (p: string) => {
  if (p === 'P1') return 'error' as const;
  if (p === 'P2') return 'warning' as const;
  return 'default' as const;
};

export function AnnotationComposerRdna() {
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>('fix');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('P2');
  const [message, setMessage] = useState('');
  const [lightMode, setLightMode] = useState(true);

  return (
    <div className="bg-card border border-line pixel-rounded-sm shadow-floating w-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-rule">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          Annotate
        </span>
      </div>

      {/* Intent row */}
      <div className="flex flex-col gap-1.5 px-3 pt-3">
        <span className="font-mono text-xs text-mute">Intent</span>
        <div className="flex gap-1">
          {INTENTS.map((i) => (
            <Button
              key={i}
              mode="flat"
              size="sm"
              compact
              active={intent === i}
              onClick={() => setIntent(i)}
            >
              {i}
            </Button>
          ))}
        </div>
      </div>

      {/* Priority row */}
      <div className="flex flex-col gap-1.5 px-3 pt-2">
        <span className="font-mono text-xs text-mute">Priority</span>
        <div className="flex gap-1">
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setPriority(p)} className="cursor-pointer">
              <Badge
                variant={priorityVariant(p)}
                size="sm"
              >
                <span className={priority === p ? 'font-bold' : ''}>{p}</span>
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Mode row */}
      <div className="flex items-center gap-1.5 px-3 pt-2">
        <Button
          mode="flat"
          size="sm"
          compact
          active={lightMode}
          onClick={() => setLightMode(true)}
        >
          light
        </Button>
        <Button
          mode="flat"
          size="sm"
          compact
          active={!lightMode}
          onClick={() => setLightMode(false)}
        >
          dark
        </Button>
        <Badge variant="default" size="sm">
          {lightMode ? 'light' : 'dark'}
        </Badge>
      </div>

      {/* Textarea */}
      <div className="px-3 pt-2">
        <textarea
          className="w-full h-16 bg-page border border-rule rounded-sm font-mono text-xs text-main p-2 resize-none outline-none focus:border-accent transition-colors placeholder:text-mute"
          placeholder="Describe the annotation..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-1.5 px-3 py-2 border-t border-rule">
        <Button mode="flat" size="sm" onClick={() => setMessage('')}>
          Cancel
        </Button>
        <Button size="sm">
          Pin
        </Button>
      </div>
    </div>
  );
}
