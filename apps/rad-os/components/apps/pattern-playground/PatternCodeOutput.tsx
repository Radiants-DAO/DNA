'use client';

import { useState } from 'react';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';
import type { PatternPlaygroundState, CodeFormat } from './types';
import { generateCode } from './code-gen';

interface PatternCodeOutputProps {
  state: PatternPlaygroundState;
}

export function PatternCodeOutput({ state }: PatternCodeOutputProps) {
  const [format, setFormat] = useState<CodeFormat>('jsx');
  const [copied, setCopied] = useState(false);

  const code = generateCode(format, state);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-t border-rule bg-depth">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
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

        <Button
          size="sm"
          icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Code block */}
      <div className="px-3 pb-3">
        <div className="pixel-rounded-xs">
          <pre className="font-mono text-xs text-sub bg-page p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
}
