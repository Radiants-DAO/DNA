'use client';

import { useState } from 'react';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';
import type { RegistryEntry } from '@rdna/radiants/registry';
import { generateComponentCode, type CodeFormat } from './component-code-gen';

interface ComponentCodeOutputProps {
  entry: RegistryEntry | null;
  propValues: Record<string, unknown>;
}

export function ComponentCodeOutput({ entry, propValues }: ComponentCodeOutputProps) {
  const [format, setFormat] = useState<CodeFormat>('jsx');
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-mute text-center">
          Select a component to see its code output
        </p>
      </div>
    );
  }

  const code = generateComponentCode(format, entry, propValues);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col min-h-0 max-h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-rule">
        <div className="flex items-center justify-between">
          <span className="font-heading text-xs text-mute uppercase tracking-wide">
            Code
          </span>
          <Button
            size="sm"
            icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Code block */}
      <div className="min-h-0 p-3 overflow-auto">
        <pre className="font-mono text-xs text-sub bg-depth p-3 whitespace-pre-wrap">
          {code}
        </pre>
      </div>

      {/* Format toggle — pinned to bottom */}
      <div className="shrink-0 px-3 py-2 border-t border-rule">
        <ToggleGroup
          value={[format]}
          onValueChange={(vals) => { if (vals.length) setFormat(vals[0] as CodeFormat); }}
          size="sm"
          compact
        >
          <ToggleGroup.Item value="jsx">JSX</ToggleGroup.Item>
          <ToggleGroup.Item value="css">CSS</ToggleGroup.Item>
          <ToggleGroup.Item value="tailwind">Tailwind</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}
