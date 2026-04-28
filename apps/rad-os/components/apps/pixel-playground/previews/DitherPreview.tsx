'use client';

import { useMemo, useState } from 'react';
import {
  ditherBands,
  type BayerMatrixSize,
  type DitherDirection,
  type PreparedDitherBands,
} from '@rdna/pixel';
import { Button, Input, ToggleGroup } from '@rdna/radiants/components/core';
import { generateDitherCode, type DitherOutputFormat } from '../dither-code-gen';

const MATRIX_SIZES: BayerMatrixSize[] = [2, 4, 8, 16];
const DIRECTIONS: DitherDirection[] = ['down', 'up'];
const PIXEL_SCALES = [1, 2, 3, 4] as const;

interface BandStackProps {
  ramp: PreparedDitherBands;
  pixelScale: number;
}

function BandStack({ ramp, pixelScale }: BandStackProps) {
  const tilePx = ramp.matrix * pixelScale;
  return (
    <>
      {ramp.bands.map((band) => (
        <div
          key={band.index}
          aria-hidden
          style={{
            position: 'absolute',
            left: '0%',
            right: '0%',
            top: `${(band.index / ramp.steps) * 100}%`,
            height: `${100 / ramp.steps}%`,
            backgroundColor: 'var(--color-window-chrome-from)',
            WebkitMaskImage: band.mask.maskImage,
            maskImage: band.mask.maskImage,
            WebkitMaskSize: `${tilePx}px ${tilePx}px`,
            maskSize: `${tilePx}px ${tilePx}px`,
            WebkitMaskRepeat: 'repeat',
            maskRepeat: 'repeat',
            imageRendering: 'pixelated',
          }}
        />
      ))}
    </>
  );
}

export function DitherPreview() {
  const [matrix, setMatrix] = useState<BayerMatrixSize>(4);
  const [steps, setSteps] = useState(17);
  const [direction, setDirection] = useState<DitherDirection>('down');
  const [pixelScale, setPixelScale] = useState<number>(2);
  const [format, setFormat] = useState<DitherOutputFormat>('snippet');
  const [copied, setCopied] = useState(false);

  const ramp = useMemo(
    () => ditherBands({ matrix, steps, direction }),
    [matrix, steps, direction],
  );

  const code = useMemo(
    () => generateDitherCode(format, { matrix, steps, direction, pixelScale }),
    [format, matrix, steps, direction, pixelScale],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <span className="font-heading text-xs text-mute uppercase tracking-wide shrink-0">
        Dither ramp preview
      </span>

      <div className="flex flex-wrap gap-3 shrink-0 items-end">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-xs uppercase text-mute">Matrix</span>
          <ToggleGroup
            value={[String(matrix)]}
            onValueChange={(vals) => {
              if (vals.length) setMatrix(Number(vals[0]) as BayerMatrixSize);
            }}
            size="sm"
          >
            {MATRIX_SIZES.map((n) => (
              <ToggleGroup.Item key={n} value={String(n)}>
                {n}×{n}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-heading text-xs uppercase text-mute">Steps</span>
          <Input
            type="number"
            min={2}
            max={64}
            value={steps}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(next) && next >= 2 && next <= 64) setSteps(next);
            }}
            className="w-20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-heading text-xs uppercase text-mute">Direction</span>
          <ToggleGroup
            value={[direction]}
            onValueChange={(vals) => {
              if (vals.length) setDirection(vals[0] as DitherDirection);
            }}
            size="sm"
          >
            {DIRECTIONS.map((d) => (
              <ToggleGroup.Item key={d} value={d}>
                {d}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-heading text-xs uppercase text-mute">Pixel scale</span>
          <ToggleGroup
            value={[String(pixelScale)]}
            onValueChange={(vals) => {
              if (vals.length) setPixelScale(Number(vals[0]));
            }}
            size="sm"
          >
            {PIXEL_SCALES.map((s) => (
              <ToggleGroup.Item key={s} value={String(s)}>
                {s}×
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <span className="font-heading text-xs text-mute uppercase tracking-wide shrink-0">
        Applied (chrome preview)
      </span>
      <div
        className="flex-1 min-h-0 min-w-0 relative pixel-rounded-6"
        style={{ backgroundColor: 'var(--color-window-chrome-to)' }}
      >
        <BandStack ramp={ramp} pixelScale={pixelScale} />
      </div>

      <div className="shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-heading text-xs text-mute uppercase tracking-wide">Output</span>
          <Button
            size="sm"
            icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
            aria-label={copied ? 'Copied to clipboard' : 'Copy dither output to clipboard'}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <pre className="font-mono text-xs text-sub bg-depth p-3 whitespace-pre-wrap max-h-40 overflow-auto">
          {code}
        </pre>
        <ToggleGroup
          value={[format]}
          onValueChange={(vals) => {
            if (vals.length) setFormat(vals[0] as DitherOutputFormat);
          }}
          size="sm"
        >
          <ToggleGroup.Item value="snippet">Snippet</ToggleGroup.Item>
          <ToggleGroup.Item value="prompt">Prompt</ToggleGroup.Item>
          <ToggleGroup.Item value="bitstring">Bitstring</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}
