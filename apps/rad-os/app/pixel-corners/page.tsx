'use client';

import { useMemo, useState } from 'react';
import { PixelBorder, generatePixelCornerBorder } from '@rdna/radiants/components/core';

const PRESETS = [4, 6, 8, 12, 16, 20, 32, 48, 64] as const;

export default function PixelCornersPreview() {
  const [radius, setRadius] = useState(20);
  const [boxWidth, setBoxWidth] = useState(240);
  const [boxHeight, setBoxHeight] = useState(160);

  const cells = useMemo(() => generatePixelCornerBorder(radius), [radius]);

  return (
    <main className="min-h-screen bg-page text-main p-8">
      <div className="max-w-[48rem] mx-auto flex flex-col gap-8">
        <header>
          <h1 className="font-display text-3xl">Pixel Corner Live Preview</h1>
          <p className="text-sm opacity-70 mt-2">
            Live-generated from <code>generatePixelCornerBorder(R)</code>.
            Every corner is diagonally symmetric, derived from cell-center
            rasterization of a circle of radius R.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <label className="flex items-center gap-4 text-sm">
            <span className="w-20">Radius</span>
            <input
              type="range"
              min={1}
              max={100}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min={1}
              max={1000}
              value={radius}
              onChange={(e) => setRadius(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 px-2 py-1 bg-page text-main border border-line text-right"
            />
            <span className="w-16 text-xs opacity-60">px</span>
          </label>

          <label className="flex items-center gap-4 text-sm">
            <span className="w-20">Width</span>
            <input
              type="range"
              min={50}
              max={600}
              value={boxWidth}
              onChange={(e) => setBoxWidth(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-20 text-right">{boxWidth}px</span>
          </label>

          <label className="flex items-center gap-4 text-sm">
            <span className="w-20">Height</span>
            <input
              type="range"
              min={50}
              max={400}
              value={boxHeight}
              onChange={(e) => setBoxHeight(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-20 text-right">{boxHeight}px</span>
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Preview</h2>
          <div className="p-8 bg-inv/5 flex items-center justify-center min-h-[24rem]">
            <PixelBorder
              radius={radius}
              style={{ width: boxWidth, height: boxHeight }}
            >
              <div
                className="w-full h-full flex items-center justify-center text-xs"
                style={{ width: boxWidth, height: boxHeight }}
              >
                {radius}px radius · {cells.length} border cells
              </div>
            </PixelBorder>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Zoom (8×)</h2>
          <div className="p-4 bg-inv/5 flex items-center justify-center">
            <svg
              width={radius * 8}
              height={radius * 8}
              viewBox={`0 0 ${radius} ${radius}`}
              style={{ imageRendering: 'pixelated' }}
            >
              <rect width={radius} height={radius} fill="var(--color-inv)" opacity={0.08} />
              {cells.map(([x, y]: [number, number]) => (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill="var(--color-main)"
                />
              ))}
            </svg>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider opacity-60">Presets</h2>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-3 py-1 border text-sm ${
                  radius === r ? 'bg-main text-page' : 'border-line'
                }`}
              >
                {r}px
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
