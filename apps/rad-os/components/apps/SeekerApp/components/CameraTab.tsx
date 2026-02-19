'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { DitherAlgorithm } from '../types';

const LIGHT = [0xFE, 0xF8, 0xE2]; // cream #FEF8E2
const DARK = [0x0F, 0x0E, 0x0C];  // black #0F0E0C
const SOURCE_IMAGE = '/assets/images/Cowboy-Profile-from-Midjourney_1.avif';

const ALGORITHMS: { id: DitherAlgorithm; label: string }[] = [
  { id: 'floyd-steinberg', label: 'F-S' },
  { id: 'ordered', label: 'ORD' },
  { id: 'atkinson', label: 'ATK' },
  { id: 'bayer', label: 'BAY' },
];

// Bayer 4x4 threshold matrix (normalized 0-255)
const BAYER_4X4 = [
  [0, 128, 32, 160],
  [192, 64, 224, 96],
  [48, 176, 16, 144],
  [240, 112, 208, 80],
];

// Bayer 8x8 threshold matrix (normalized 0-255)
const BAYER_8X8 = [
  [0, 128, 32, 160, 8, 136, 40, 168],
  [192, 64, 224, 96, 200, 72, 232, 104],
  [48, 176, 16, 144, 56, 184, 24, 152],
  [240, 112, 208, 80, 248, 120, 216, 88],
  [12, 140, 44, 172, 4, 132, 36, 164],
  [204, 76, 236, 108, 196, 68, 228, 100],
  [60, 188, 28, 156, 52, 180, 20, 148],
  [252, 124, 220, 92, 244, 116, 212, 84],
];

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function applyDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  algorithm: DitherAlgorithm
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale first
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = luminance(data[idx], data[idx + 1], data[idx + 2]);
  }

  const setPixel = (i: number, isLight: boolean) => {
    const idx = i * 4;
    const c = isLight ? LIGHT : DARK;
    data[idx] = c[0];
    data[idx + 1] = c[1];
    data[idx + 2] = c[2];
    data[idx + 3] = 255;
  };

  switch (algorithm) {
    case 'floyd-steinberg': {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          const old = gray[i];
          const val = old > 127 ? 255 : 0;
          gray[i] = val;
          const err = old - val;
          if (x + 1 < width) gray[i + 1] += err * 7 / 16;
          if (y + 1 < height) {
            if (x > 0) gray[(y + 1) * width + x - 1] += err * 3 / 16;
            gray[(y + 1) * width + x] += err * 5 / 16;
            if (x + 1 < width) gray[(y + 1) * width + x + 1] += err * 1 / 16;
          }
          setPixel(i, val === 255);
        }
      }
      break;
    }
    case 'ordered': {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          const threshold = BAYER_4X4[y % 4][x % 4];
          setPixel(i, gray[i] > threshold);
        }
      }
      break;
    }
    case 'atkinson': {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          const old = gray[i];
          const val = old > 127 ? 255 : 0;
          gray[i] = val;
          const err = (old - val) / 8;
          if (x + 1 < width) gray[i + 1] += err;
          if (x + 2 < width) gray[i + 2] += err;
          if (y + 1 < height) {
            if (x > 0) gray[(y + 1) * width + x - 1] += err;
            gray[(y + 1) * width + x] += err;
            if (x + 1 < width) gray[(y + 1) * width + x + 1] += err;
          }
          if (y + 2 < height) {
            gray[(y + 2) * width + x] += err;
          }
          setPixel(i, val === 255);
        }
      }
      break;
    }
    case 'bayer': {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          const threshold = BAYER_8X8[y % 8][x % 8];
          setPixel(i, gray[i] > threshold);
        }
      }
      break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function CameraTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>('floyd-steinberg');
  const [flash, setFlash] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load source image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = SOURCE_IMAGE;
    img.onload = () => {
      imageRef.current = img;
      renderDither(img, algorithm);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderDither = useCallback(
    (img: HTMLImageElement, algo: DitherAlgorithm) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const W = 360;
      const H = 480;
      canvas.width = W;
      canvas.height = H;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw source image scaled to canvas
      ctx.drawImage(img, 0, 0, W, H);
      applyDither(ctx, W, H, algo);
    },
    []
  );

  // Re-render when algorithm changes
  useEffect(() => {
    if (imageRef.current) {
      renderDither(imageRef.current, algorithm);
    }
  }, [algorithm, renderDither]);

  const handleCapture = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center bg-black min-h-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Corner brackets */}
        <div className="absolute inset-4 pointer-events-none">
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cream/40" />
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cream/40" />
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cream/40" />
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cream/40" />
        </div>

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-[1px] bg-cream/20" />
          <div className="absolute w-[1px] h-8 bg-cream/20" />
        </div>

        {/* Flash overlay */}
        {flash && (
          <div className="absolute inset-0 bg-white/80 pointer-events-none animate-[fadeOut_200ms_ease-out_forwards]" />
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 space-y-3 shrink-0">
        {/* Algorithm selector */}
        <div className="flex items-center justify-center gap-2">
          {ALGORITHMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setAlgorithm(id)}
              className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold transition-colors ${
                algorithm === id
                  ? 'bg-sun-yellow text-black'
                  : 'bg-white/10 text-cream/50 hover:text-cream/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Capture button */}
        <div className="flex justify-center">
          <button
            onClick={handleCapture}
            className="w-14 h-14 rounded-full border-4 border-cream/40 flex items-center justify-center hover:border-cream/60 transition-colors active:scale-95"
            aria-label="Capture"
          >
            <div className="w-10 h-10 rounded-full bg-cream/90" />
          </button>
        </div>
      </div>
    </div>
  );
}
