'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ActionButton,
  ButtonStrip,
  NumberInput,
  PropertyRow,
} from '@rdna/ctrl';
import { AppWindow } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import {
  ditherBands,
  type BayerMatrixSize,
  type DitherDirection,
  type PreparedDitherBands,
} from '@rdna/pixel';
import { useControlSurfaceSlot } from '@/components/Rad_os/AppWindow';
import {
  generateDitherCode,
  type DitherOutputFormat,
} from '@/components/apps/pixel-playground/dither-code-gen';
import {
  StudioRailDropdown,
  StudioRailSection,
} from '@/components/apps/studio/StudioRailSection';

const MATRIX_OPTIONS: BayerMatrixSize[] = [2, 4, 8, 16];
const DIRECTION_OPTIONS: DitherDirection[] = ['down', 'up'];
const PIXEL_SCALE_OPTIONS = [1, 2, 3, 4] as const;
const OUTPUT_FORMAT_OPTIONS: DitherOutputFormat[] = ['snippet', 'prompt', 'bitstring'];

interface DitherBandStackProps {
  ramp: PreparedDitherBands;
  pixelScale: number;
}

function DitherBandStack({ ramp, pixelScale }: DitherBandStackProps) {
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

export function DitherTab() {
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
  const tilePx = matrix * pixelScale;
  const bandCount = ramp.bands.length;
  const code = useMemo(
    () => generateDitherCode(format, { matrix, steps, direction, pixelScale }),
    [format, matrix, steps, direction, pixelScale],
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  const controlsPanel = useMemo(
    () => (
      <StudioRailSection>
        <StudioRailDropdown
          title="MATRIX"
          collapsedIcon={<Icon name="interface-essential-dial-pad-1" />}
          collapsedTooltip="Matrix"
        >
          <PropertyRow label="SIZE" chrome="flush" size="xl" divider={false}>
            <ButtonStrip
              value={String(matrix)}
              onChange={(value) => setMatrix(Number(String(value)) as BayerMatrixSize)}
              options={MATRIX_OPTIONS.map((value) => ({
                value: String(value),
                label: `${value}x${value}`,
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
          <PropertyRow label="STEPS" chrome="flush" size="xl" divider={false}>
            <NumberInput
              value={steps}
              onValueChange={(value) => {
                if (value == null || !Number.isFinite(value)) return;
                setSteps(Math.max(2, Math.min(64, Math.round(value))));
              }}
              min={2}
              max={64}
              step={1}
              active
              className="flex-1"
            />
          </PropertyRow>
        </StudioRailDropdown>

        <StudioRailDropdown
          title="RAMP"
          collapsedIcon={<Icon name="arrow-down-thin" />}
          collapsedTooltip="Ramp"
        >
          <PropertyRow label="DIR" chrome="flush" size="xl" divider={false}>
            <ButtonStrip
              value={direction}
              onChange={(value) => setDirection(String(value) as DitherDirection)}
              options={DIRECTION_OPTIONS.map((value) => ({
                value,
                label: value.toUpperCase(),
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
        </StudioRailDropdown>

        <StudioRailDropdown
          title="RENDER"
          collapsedIcon={<Icon name="grid-3x3" />}
          collapsedTooltip="Render"
        >
          <PropertyRow label="SCALE" chrome="flush" size="xl" divider={false}>
            <ButtonStrip
              value={String(pixelScale)}
              onChange={(value) => setPixelScale(Number(String(value)))}
              options={PIXEL_SCALE_OPTIONS.map((value) => ({
                value: String(value),
                label: `${value}x`,
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
        </StudioRailDropdown>
      </StudioRailSection>
    ),
    [direction, matrix, pixelScale, steps],
  );

  const outputPanel = useMemo(
    () => (
      <StudioRailSection>
        <StudioRailDropdown
          title="OUTPUT"
          collapsedIcon={<Icon name="copy-to-clipboard" />}
          collapsedTooltip="Output"
          headerControls={
            <ActionButton
              label={copied ? 'Copied' : 'Copy'}
              icon={<Icon name={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} />}
              onClick={handleCopy}
              stretch={false}
            />
          }
        >
          <PropertyRow label="TYPE" chrome="flush" size="xl" divider={false}>
            <ButtonStrip
              value={format}
              onChange={(value) => setFormat(String(value) as DitherOutputFormat)}
              options={OUTPUT_FORMAT_OPTIONS.map((value) => ({
                value,
                label: value.toUpperCase(),
              }))}
              size="sm"
              className="w-full"
            />
          </PropertyRow>
          <pre className="max-h-[22rem] overflow-auto whitespace-pre-wrap bg-ctrl-cell-bg p-2 font-mono text-xs leading-4 text-ctrl-label">
            {code}
          </pre>
        </StudioRailDropdown>

        <StudioRailDropdown
          title="DETAILS"
          collapsedIcon={<Icon name="info" />}
          collapsedTooltip="Details"
        >
          <PropertyRow label="BANDS" chrome="flush" size="xl" divider={false}>
            <span className="font-mono text-xs text-ctrl-text-active">
              {bandCount}
            </span>
          </PropertyRow>
          <PropertyRow label="TILE" chrome="flush" size="xl" divider={false}>
            <span className="font-mono text-xs text-ctrl-text-active">
              {tilePx}px
            </span>
          </PropertyRow>
          <PropertyRow label="DIRECTION" chrome="flush" size="xl" divider={false}>
            <span className="font-mono text-xs uppercase text-ctrl-text-active">
              {direction}
            </span>
          </PropertyRow>
        </StudioRailDropdown>
      </StudioRailSection>
    ),
    [bandCount, code, copied, direction, format, handleCopy, tilePx],
  );

  const controlsSlot = useMemo(
    () => ({
      side: 'left' as const,
      maxWidth: 320,
      label: 'Settings',
      hideTab: true,
      isOpen: true,
      children: controlsPanel,
    }),
    [controlsPanel],
  );
  const outputSlot = useMemo(
    () => ({
      side: 'right' as const,
      maxWidth: 390,
      label: 'Output',
      hideTab: true,
      isOpen: true,
      children: outputPanel,
    }),
    [outputPanel],
  );

  useControlSurfaceSlot(controlsSlot);
  useControlSurfaceSlot(outputSlot);

  return (
    <AppWindow.Content layout="single" className="bg-brand-stage">
      <div className="flex-1 min-h-0 min-w-0 p-2">
        <AppWindow.Island
          corners="pixel"
          padding="none"
          noScroll
          className="mx-auto h-full max-h-full max-w-full"
        >
          <section
            aria-labelledby="pixel-lab-dither-title"
            className="grid h-full min-h-0 grid-rows-[auto_1fr] bg-inv text-ctrl-label"
          >
            <header className="border-b border-rule px-3 py-2">
              <p className="font-mono text-xs uppercase tracking-normal text-ctrl-muted">
                Dither
              </p>
              <h2
                id="pixel-lab-dither-title"
                className="font-mono text-sm uppercase tracking-normal text-ctrl-label"
              >
                Dither ramp preview
              </h2>
            </header>

            <div
              className="relative min-h-0 bg-depth"
              style={{ backgroundColor: 'var(--color-window-chrome-to)' }}
            >
              <DitherBandStack ramp={ramp} pixelScale={pixelScale} />
              <dl className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t border-rule bg-ctrl-cell-bg font-mono text-xs uppercase tracking-normal">
                <div className="flex items-center justify-between gap-2 border-r border-rule px-2 py-1">
                  <dt className="text-ctrl-label">BANDS</dt>
                  <dd className="text-ctrl-text-active">{bandCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 border-r border-rule px-2 py-1">
                  <dt className="text-ctrl-label">TILE</dt>
                  <dd className="text-ctrl-text-active">{tilePx}px</dd>
                </div>
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                  <dt className="text-ctrl-label">DIRECTION</dt>
                  <dd className="text-ctrl-text-active">{direction}</dd>
                </div>
              </dl>
            </div>
          </section>
        </AppWindow.Island>
      </div>
    </AppWindow.Content>
  );
}

export default DitherTab;
