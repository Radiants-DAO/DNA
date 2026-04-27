'use client';

// =============================================================================
// LogoMaker — canvas-only renderer.
//
// All state lives in the parent (BrandApp) via `useLogoMakerState`. This file
// now renders only the composed SVG preview. The docked control surface
// (LogoMakerControls) drives the state from the AppWindow's right-hand dock.
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import { AppWindow } from '@rdna/radiants/components/core';
import { PATTERN_REGISTRY, bitsToMergedRects, getPattern } from '@rdna/pixel';
import {
  composeLogoSvg,
  getRatioPreset,
  rasterizeSvgToPng,
  RATIO_PRESETS,
  type Bg,
  type BgOption,
  type BrandColor,
  type LogoVariant,
  type RatioPreset,
  type RatioPresetId,
} from '@/lib/logo-maker';
import { LOGO_PATHS } from '@/lib/logo-maker/logoPaths';
import type { LogoMakerPatternOption } from './LogoMakerControls';

// ─── Defaults (state previously lived inline in LogoMaker) ───────────────

const DEFAULT_VARIANT: LogoVariant = 'mark';
const DEFAULT_LOGO_COLOR: BrandColor = 'ink';
const DEFAULT_PATTERN = 'checkerboard';
const DEFAULT_PATTERN_FG: BrandColor = 'ink';
const DEFAULT_PATTERN_BG: BrandColor = 'cream';
const DEFAULT_PATTERN_SCALE = 0.25;
const DEFAULT_SIZE_FRACTION = 0.7; // matches previous `mark` default.
const DEFAULT_RATIO: RatioPresetId = 'square-512';
const DEFAULT_FORMAT: 'png' | 'svg' = 'png';
const DEFAULT_EXPORT_MULTIPLIER = 1;
const DEFAULT_BG_OPTION: BgOption = 'cream';
const PATTERN_SCALE_MIN = 0.1;
const PATTERN_SCALE_MAX = 1;
const PATTERN_SCALE_STEP = 0.05;

const SIZE_PX_MIN = 16;
const SIZE_PX_MAX = 2048;
const SIZE_PX_TICKS = [16, 128, 512, 1024, 2048] as const;
const COLOR_OPTIONS: ReadonlyArray<BrandColor> = ['cream', 'ink', 'yellow'];
const EXPORT_MULTIPLIERS: ReadonlyArray<number> = [1, 2, 4];
const VARIANT_OPTIONS = Object.keys(LOGO_PATHS) as ReadonlyArray<LogoVariant>;
const BG_OPTIONS: ReadonlyArray<BgOption> = [
  'transparent',
  'cream',
  'ink',
  'yellow',
  'pattern',
];

// ─── State hook (consumed by BrandApp) ────────────────────────────────────

export interface LogoMakerState {
  // canvas-driving state
  variant: LogoVariant;
  sizeFraction: number;
  logoColor: BrandColor;
  bgOption: BgOption;
  pattern: string;
  patternFg: BrandColor;
  patternBg: BrandColor;
  patternScale: number;
  ratio: RatioPresetId;
  format: 'png' | 'svg';
  exportMultiplier: number;
  copied: boolean;

  // derived render inputs
  bg: Bg;
  preset: RatioPreset;

  // derived props for LogoMakerControls
  sizePx: number;
  sizeMin: number;
  sizeMax: number;
  sizeTicks: ReadonlyArray<number>;
  availableVariants: ReadonlyArray<LogoVariant>;
  availableColors: ReadonlyArray<BrandColor>;
  availableBgOptions: ReadonlyArray<BgOption>;
  availablePatterns: ReadonlyArray<LogoMakerPatternOption>;
  availableMultipliers: ReadonlyArray<number>;
  patternScaleMin: number;
  patternScaleMax: number;
  patternScaleStep: number;

  // handlers
  onVariantChange: (v: LogoVariant) => void;
  onSizePxChange: (px: number) => void;
  onColorChange: (c: BrandColor) => void;
  onBgOptionChange: (b: BgOption) => void;
  onPatternChange: (name: string) => void;
  onPatternFgChange: (c: BrandColor) => void;
  onPatternBgChange: (c: BrandColor) => void;
  onPatternScaleChange: (v: number) => void;
  onAspectRatioChange: (id: RatioPresetId) => void;
  onExportMultiplierChange: (m: number) => void;
  onFormatChange: (f: 'png' | 'svg') => void;
  onCopy: () => void;
  onDownload: () => void;
}

// Pattern grids are deterministic per name — merge once and share thumbnails.
const PATTERN_THUMB_CACHE = new Map<
  string,
  { width: number; height: number; rects: ReturnType<typeof bitsToMergedRects> }
>();

function getPatternThumbGeometry(name: string) {
  const cached = PATTERN_THUMB_CACHE.get(name);
  if (cached) return cached;
  const grid = getPattern(name);
  if (!grid) return null;
  const geometry = {
    width: grid.width,
    height: grid.height,
    rects: bitsToMergedRects(grid.bits, grid.width, grid.height),
  };
  PATTERN_THUMB_CACHE.set(name, geometry);
  return geometry;
}

function PatternThumb({ name }: { name: string }) {
  const geometry = getPatternThumbGeometry(name);
  if (!geometry) return null;
  const { width, height, rects } = geometry;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full block"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

// Registry → dock options with SVG thumbnails (rendered once, memoised).
const PATTERN_OPTIONS: ReadonlyArray<LogoMakerPatternOption> = PATTERN_REGISTRY.map(
  (p) => ({ name: p.name, preview: <PatternThumb name={p.name} /> }),
);

export function useLogoMakerState(): LogoMakerState {
  const [variant, setVariant] = useState<LogoVariant>(DEFAULT_VARIANT);
  const [sizeFraction, setSizeFraction] = useState<number>(DEFAULT_SIZE_FRACTION);
  const [logoColor, setLogoColor] = useState<BrandColor>(DEFAULT_LOGO_COLOR);
  const [bgOption, setBgOption] = useState<BgOption>(DEFAULT_BG_OPTION);
  const [pattern, setPattern] = useState<string>(DEFAULT_PATTERN);
  const [patternFg, setPatternFg] = useState<BrandColor>(DEFAULT_PATTERN_FG);
  const [patternBg, setPatternBg] = useState<BrandColor>(DEFAULT_PATTERN_BG);
  const [patternScale, setPatternScale] = useState<number>(DEFAULT_PATTERN_SCALE);
  const [ratio, setRatio] = useState<RatioPresetId>(DEFAULT_RATIO);
  const [format, setFormat] = useState<'png' | 'svg'>(DEFAULT_FORMAT);
  const [exportMultiplier, setExportMultiplier] =
    useState<number>(DEFAULT_EXPORT_MULTIPLIER);
  const [copied, setCopied] = useState(false);

  const preset = getRatioPreset(ratio) ?? RATIO_PRESETS[0];
  // Canvas "edge" used for the PX readout — the shorter side keeps the readout
  // numerically consistent across square / portrait / landscape presets.
  const canvasEdge = Math.min(preset.width, preset.height);
  const sizePx = Math.max(1, Math.round(sizeFraction * canvasEdge));

  const onSizePxChange = useCallback(
    (px: number) => {
      const next = canvasEdge > 0 ? px / canvasEdge : 0;
      setSizeFraction(Math.min(1, Math.max(0.01, next)));
    },
    [canvasEdge],
  );

  const bg: Bg = useMemo(() => {
    if (bgOption === 'transparent') return { kind: 'transparent' };
    if (bgOption === 'pattern')
      return { kind: 'pattern', pattern, fg: patternFg, bgColor: patternBg };
    return { kind: 'solid', color: bgOption };
  }, [bgOption, pattern, patternFg, patternBg]);

  const buildExportSvg = useCallback(
    () =>
      composeLogoSvg({
        variant,
        logoColor,
        bg,
        width: preset.width * exportMultiplier,
        height: preset.height * exportMultiplier,
        size: sizeFraction,
        patternScale,
      }),
    [variant, logoColor, bg, preset.width, preset.height, exportMultiplier, sizeFraction, patternScale],
  );

  const filename = useMemo(
    () =>
      `radiants-${variant}-${ratio}${exportMultiplier > 1 ? `@${exportMultiplier}x` : ''}.${format}`,
    [variant, ratio, exportMultiplier, format],
  );

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(buildExportSvg());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [buildExportSvg]);

  const onDownload = useCallback(async () => {
    const exportW = preset.width * exportMultiplier;
    const exportH = preset.height * exportMultiplier;
    const exportSvg = buildExportSvg();
    const blob =
      format === 'svg'
        ? new Blob([exportSvg], { type: 'image/svg+xml' })
        : await rasterizeSvgToPng(exportSvg, exportW, exportH);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [buildExportSvg, format, preset.width, preset.height, exportMultiplier, filename]);

  return {
    variant,
    sizeFraction,
    logoColor,
    bgOption,
    pattern,
    patternFg,
    patternBg,
    patternScale,
    ratio,
    format,
    exportMultiplier,
    copied,

    bg,
    preset,

    sizePx,
    sizeMin: SIZE_PX_MIN,
    sizeMax: SIZE_PX_MAX,
    sizeTicks: SIZE_PX_TICKS,
    availableVariants: VARIANT_OPTIONS,
    availableColors: COLOR_OPTIONS,
    availableBgOptions: BG_OPTIONS,
    availablePatterns: PATTERN_OPTIONS,
    availableMultipliers: EXPORT_MULTIPLIERS,
    patternScaleMin: PATTERN_SCALE_MIN,
    patternScaleMax: PATTERN_SCALE_MAX,
    patternScaleStep: PATTERN_SCALE_STEP,

    onVariantChange: setVariant,
    onSizePxChange,
    onColorChange: setLogoColor,
    onBgOptionChange: setBgOption,
    onPatternChange: setPattern,
    onPatternFgChange: setPatternFg,
    onPatternBgChange: setPatternBg,
    onPatternScaleChange: setPatternScale,
    onAspectRatioChange: setRatio,
    onExportMultiplierChange: setExportMultiplier,
    onFormatChange: setFormat,
    onCopy,
    onDownload,
  };
}

// ─── Canvas component ─────────────────────────────────────────────────────

export interface LogoMakerCanvasProps {
  state: LogoMakerState;
}

export function LogoMakerCanvas({ state }: LogoMakerCanvasProps) {
  const { variant, logoColor, bg, preset, sizeFraction, patternScale } = state;

  const previewSvg = useMemo(
    () =>
      scaleSvgForPreview(
        composeLogoSvg({
          variant,
          logoColor,
          bg,
          width: preset.width,
          height: preset.height,
          size: sizeFraction,
          patternScale,
        }),
      ),
    [variant, logoColor, bg, preset.width, preset.height, sizeFraction, patternScale],
  );

  return (
    <AppWindow.Content layout="single">
      <AppWindow.Island corners="pixel" padding="md" noScroll className="flex-1">
        <div className="flex flex-col h-full">
          <div
            className="flex-1 min-h-0 flex items-center justify-center"
            /* The composed SVG is the asset, not UI — inline it as-is. */
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>
      </AppWindow.Island>
    </AppWindow.Content>
  );
}

// ─── Local helpers ────────────────────────────────────────────────────────

function scaleSvgForPreview(svg: string): string {
  // Strip the explicit width/height so the SVG fills its container while
  // preserving the viewBox (and therefore aspect ratio).
  return svg
    .replace(/\swidth="\d+"/, ' width="100%"')
    .replace(/\sheight="\d+"/, ' height="100%"')
    .replace(
      '<svg ',
      '<svg style="max-width:100%;max-height:100%;" preserveAspectRatio="xMidYMid meet" ',
    );
}
