'use client';

import { useRef, useState } from 'react';

/** Every numeric size in the generated CSS, plus the special `full` circle. */
const SIZES = [2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 'full'] as const;
type Size = (typeof SIZES)[number];

/** Numeric sizes only, ascending — used for discrete clamping. */
const NUMERIC_SIZES = [2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

/** Suggested card dimensions keyed by pixel-corner size. */
function defaultCardSize(size: Size): { w: number; h: number } {
  if (size === 'full') return { w: 32, h: 32 };
  if (size <= 8) return { w: 100, h: 70 };
  if (size <= 20) return { w: 180, h: 120 };
  if (size <= 32) return { w: 240, h: 160 };
  return { w: 320, h: 200 };
}

/**
 * Clamp a pixel-corner size to fit the element dimensions.
 *
 * Returns the largest size from the numeric scale where
 * `2 × gridSize × pixelScale ≤ min(width, height)`.
 * If no size fits, returns the smallest available (2).
 * "full" maps to 20 for clamping purposes.
 */
function clampCornerSize(
  requested: Size,
  width: number,
  height: number,
  scale: number,
): number {
  const gridSize = requested === 'full' ? 20 : requested;
  const maxGrid = Math.floor(Math.min(width, height) / (2 * scale));
  if (gridSize <= maxGrid) return gridSize;
  // Step down to the largest size that fits
  for (let i = NUMERIC_SIZES.length - 1; i >= 0; i--) {
    if (NUMERIC_SIZES[i] <= maxGrid) return NUMERIC_SIZES[i];
  }
  return NUMERIC_SIZES[0];
}

const SHADOW_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Drop-shadow soft', value: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.15))' },
  { label: 'Drop-shadow strong', value: 'drop-shadow(0 4px 8px rgb(0 0 0 / 0.35))' },
  { label: 'pixel-shadow-resting', value: 'pixel-shadow' },
] as const;

export default function PixelCornersPreview() {
  const [boxWidth, setBoxWidth] = useState(0);
  const [boxHeight, setBoxHeight] = useState(0);
  const [borderColor, setBorderColor] = useState('#1a1a19');
  const [pixelScale, setPixelScale] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(25);
  const [shadow, setShadow] = useState('none');
  const [highlightedSize, setHighlightedSize] = useState<Size | null>(null);

  const sizeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSize = (size: Size) => {
    setHighlightedSize(size);
    const el = sizeRefs.current[String(size)];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedSize(null), 1500);
  };

  /** Resolve card width/height — 0 means "use default per size" */
  const cardW = (size: Size) => (boxWidth > 0 ? boxWidth : defaultCardSize(size).w);
  const cardH = (size: Size) => (boxHeight > 0 ? boxHeight : defaultCardSize(size).h);

  const className = (size: Size) => `pixel-rounded-${size}`;

  const usePixelShadow = shadow === 'pixel-shadow';
  const filterStyle = shadow !== 'none' && !usePixelShadow ? shadow : undefined;

  return (
    <main className="min-h-screen bg-page text-main p-8">
      <div
        className="max-w-[64rem] mx-auto flex flex-col gap-10"
        style={
          {
            '--pixel-scale': pixelScale,
            '--color-line': borderColor,
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <header>
          <h1 className="font-display text-3xl">Pixel Corners Preview</h1>
          <p className="text-sm opacity-70 mt-2">
            CSS-only pixel corners via <code>mask-image</code>. No SVG component needed — just apply{' '}
            <code>pixel-rounded-N</code> classes.
          </p>
        </header>

        {/* Controls */}
        <section className="flex flex-col gap-4 p-4 bg-inv/5">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Controls</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Box width */}
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0">Box width</span>
              <input
                type="range"
                min={0}
                max={400}
                value={boxWidth}
                onChange={(e) => setBoxWidth(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-16 text-right text-xs opacity-60">
                {boxWidth === 0 ? 'auto' : `${boxWidth}px`}
              </span>
            </label>

            {/* Box height */}
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0">Box height</span>
              <input
                type="range"
                min={0}
                max={300}
                value={boxHeight}
                onChange={(e) => setBoxHeight(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-16 text-right text-xs opacity-60">
                {boxHeight === 0 ? 'auto' : `${boxHeight}px`}
              </span>
            </label>

            {/* Border color */}
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0">Border color</span>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-8 h-8 cursor-pointer"
              />
              <span className="text-xs opacity-60">{borderColor}</span>
            </label>

            {/* Pixel scale */}
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0">Pixel scale</span>
              <input
                type="range"
                min={0.5}
                max={6}
                step={0.5}
                value={pixelScale}
                onChange={(e) => setPixelScale(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-16 text-right text-xs opacity-60">{pixelScale}x</span>
            </label>

            {/* Background opacity */}
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0">BG opacity</span>
              <input
                type="range"
                min={0}
                max={100}
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-16 text-right text-xs opacity-60">{bgOpacity}%</span>
            </label>

            {/* Shadow */}
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0">Shadow</span>
              {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:native-select-for-preview-tool owner:design-system expires:2027-01-01 issue:DNA-preview */}
              <select
                value={shadow}
                onChange={(e) => setShadow(e.target.value)}
                className="bg-page text-main px-2 py-1"
              >
                {SHADOW_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Presets — jump-to-size buttons */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Jump to Size</h2>
          <div className="flex gap-2 flex-wrap">
            {SIZES.map((size) => (
              // eslint-disable-next-line rdna/prefer-rdna-components -- reason:preset-buttons-in-preview-tool owner:design-system expires:2027-01-01 issue:DNA-preview
              <button
                key={size}
                onClick={() => scrollToSize(size)}
                className={`px-3 py-1 text-sm transition-colors ${
                  highlightedSize === size ? 'bg-main text-page' : 'bg-inv/10 hover:bg-inv/20'
                }`}
              >
                {size === 'full' ? 'full' : size}
              </button>
            ))}
          </div>
        </section>

        {/* Size Gallery */}
        <section className="flex flex-col gap-6">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Size Gallery</h2>

          <div className="flex flex-wrap gap-6 items-end">
            {SIZES.map((size) => {
              const w = cardW(size);
              const h = cardH(size);
              const effectiveGrid = clampCornerSize(size, w, h, pixelScale);
              const effectiveClass =
                size === 'full' && effectiveGrid === 20
                  ? 'pixel-rounded-full'
                  : `pixel-rounded-${effectiveGrid}`;
              const wasClamped =
                effectiveGrid !== (size === 'full' ? 20 : size);
              const label = `pixel-rounded-${size}`;
              const dims = size === 'full' ? '20x20 circle' : `${size}x${size}`;

              const card = (
                <div
                  className={`${effectiveClass} flex flex-col items-center justify-center gap-1`}
                  style={{
                    width: w,
                    height: h,
                    background: `rgb(0 128 80 / ${bgOpacity / 100})`,
                  }}
                >
                  <span className="text-xs font-mono opacity-80">{label}</span>
                  <span className="text-xs opacity-50">{dims}</span>
                  {wasClamped && (
                    <span className="text-xs opacity-70 text-amber-600">
                      → clamped to {effectiveGrid}
                    </span>
                  )}
                </div>
              );

              return (
                <div
                  key={size}
                  ref={(el) => {
                    sizeRefs.current[String(size)] = el;
                  }}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    highlightedSize === size ? 'ring-2 ring-accent p-2' : ''
                  }`}
                >
                  {/* Shadow wrapper pattern */}
                  {filterStyle ? (
                    <div style={{ filter: filterStyle }}>{card}</div>
                  ) : usePixelShadow ? (
                    <div className="pixel-shadow-resting">{card}</div>
                  ) : (
                    card
                  )}
                  <span className="text-xs opacity-40">{w}x{h}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Scale Comparison */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Scale Comparison</h2>
          <p className="text-sm opacity-50">
            <code>pixel-rounded-8</code> at 1x, 2x, and 4x <code>--pixel-scale</code>
          </p>

          <div className="flex flex-wrap gap-8 items-end">
            {[1, 2, 4].map((scale) => (
              <div key={scale} className="flex flex-col items-center gap-2">
                <div
                  className="pixel-rounded-8 flex items-center justify-center"
                  style={
                    {
                      '--pixel-scale': scale,
                      width: 180,
                      height: 120,
                      background: `rgb(0 128 80 / ${bgOpacity / 100})`,
                    } as React.CSSProperties
                  }
                >
                  <span className="text-xs font-mono opacity-80">{scale}x</span>
                </div>
                <span className="text-xs opacity-40">--pixel-scale: {scale}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Shadow Wrapper Demo */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Shadow Wrapper Demo</h2>
          <p className="text-sm opacity-50">
            <code>mask-image</code> clips <code>box-shadow</code>. Use a wrapper{' '}
            <code>div</code> with <code>filter: drop-shadow()</code>, or the{' '}
            <code>pixel-shadow-*</code> utility classes.
          </p>

          <div className="flex flex-wrap gap-8 items-end">
            {/* No shadow */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="pixel-rounded-12 flex items-center justify-center"
                style={{
                  width: 200,
                  height: 120,
                  background: `rgb(0 128 80 / ${bgOpacity / 100})`,
                }}
              >
                <span className="text-xs font-mono opacity-80">No shadow</span>
              </div>
              <span className="text-xs opacity-40">plain</span>
            </div>

            {/* Drop shadow via wrapper */}
            <div className="flex flex-col items-center gap-2">
              <div style={{ filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.25))' }}>
                <div
                  className="pixel-rounded-12 flex items-center justify-center"
                  style={{
                    width: 200,
                    height: 120,
                    background: `rgb(0 128 80 / ${bgOpacity / 100})`,
                  }}
                >
                  <span className="text-xs font-mono opacity-80">drop-shadow</span>
                </div>
              </div>
              <span className="text-xs opacity-40">filter wrapper</span>
            </div>

            {/* pixel-shadow-resting */}
            <div className="flex flex-col items-center gap-2">
              <div className="pixel-shadow-resting">
                <div
                  className="pixel-rounded-12 flex items-center justify-center"
                  style={{
                    width: 200,
                    height: 120,
                    background: `rgb(0 128 80 / ${bgOpacity / 100})`,
                  }}
                >
                  <span className="text-xs font-mono opacity-80">pixel-shadow-resting</span>
                </div>
              </div>
              <span className="text-xs opacity-40">pixel-shadow utility</span>
            </div>

            {/* pixel-shadow-floating */}
            <div className="flex flex-col items-center gap-2">
              <div className="pixel-shadow-floating">
                <div
                  className="pixel-rounded-12 flex items-center justify-center"
                  style={{
                    width: 200,
                    height: 120,
                    background: `rgb(0 128 80 / ${bgOpacity / 100})`,
                  }}
                >
                  <span className="text-xs font-mono opacity-80">pixel-shadow-floating</span>
                </div>
              </div>
              <span className="text-xs opacity-40">pixel-shadow-floating</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
