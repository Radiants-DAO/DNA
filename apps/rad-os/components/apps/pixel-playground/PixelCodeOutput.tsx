'use client';

import { useState, type ReactNode } from 'react';
import { Button, ToggleGroup } from '@rdna/radiants/components/core';
import type { PixelGrid } from '@rdna/pixel';
import type { OutputFormat, PixelMode } from './types';
import { generatePixelCode } from './pixel-code-gen';

interface PixelCodeOutputProps {
  mode: PixelMode;
  grid: PixelGrid | null;
  iconMappingActive?: boolean;
  iconMappingOutput?: string | null;
}

export function PixelCodeOutput({
  mode,
  grid,
  iconMappingActive = false,
  iconMappingOutput = null,
}: PixelCodeOutputProps) {
  const [format, setFormat] = useState<OutputFormat>('prompt');
  const [copied, setCopied] = useState(false);
  const mappingCode = iconMappingOutput ?? '';

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (iconMappingActive) {
    return (
      <OutputShell
        title="MAPPINGS"
        copied={copied}
        canCopy={Boolean(mappingCode)}
        onCopy={() => handleCopy(mappingCode)}
      >
        <OutputPre>{mappingCode}</OutputPre>
      </OutputShell>
    );
  }

  if (!grid) {
    return (
      <OutputShell title="OUTPUT">
        <div className="flex min-h-[6rem] flex-1 items-center justify-center px-3 py-4">
          <p className="text-center font-mono text-xs uppercase tracking-normal text-mute">
            Draw something to see its output
          </p>
        </div>
      </OutputShell>
    );
  }

  const code = generatePixelCode(mode, format, grid);

  return (
    <OutputShell
      title="OUTPUT"
      copied={copied}
      canCopy
      onCopy={() => handleCopy(code)}
      controls={
        <div className="px-3 pb-2">
          <ToggleGroup
            value={[format]}
            onValueChange={(values) => {
              if (values.length) setFormat(values[0] as OutputFormat);
            }}
            size="xs"
          >
            <ToggleGroup.Item value="prompt">Prompt</ToggleGroup.Item>
            <ToggleGroup.Item value="snippet">Snippet</ToggleGroup.Item>
            <ToggleGroup.Item value="bitstring">Bits</ToggleGroup.Item>
            <ToggleGroup.Item value="svg">SVG</ToggleGroup.Item>
          </ToggleGroup>
        </div>
      }
    >
      <OutputPre>{code}</OutputPre>
    </OutputShell>
  );
}

interface OutputShellProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly controls?: ReactNode;
  readonly copied?: boolean;
  readonly canCopy?: boolean;
  readonly onCopy?: () => void;
}

function OutputShell({
  title,
  children,
  controls = null,
  copied = false,
  canCopy = false,
  onCopy,
}: OutputShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col text-main">
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <span className="font-heading text-xs uppercase tracking-wide text-mute">
          {title}
        </span>
        {canCopy && (
          <Button
            size="sm"
            mode="flat"
            icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
            aria-label={copied ? 'Copied to clipboard' : 'Copy output to clipboard'}
            onClick={onCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        )}
      </div>
      {controls}
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        {children}
      </div>
    </div>
  );
}

function OutputPre({ children }: { readonly children: ReactNode }) {
  return (
    <pre className="min-h-full whitespace-pre-wrap bg-transparent p-0 font-mono text-xs text-sub">
      {children}
    </pre>
  );
}
