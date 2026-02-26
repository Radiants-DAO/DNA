'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons';
import type { DitherAlgorithm } from '../types';

const LIGHT = [0xFE, 0xF8, 0xE2]; // cream #FEF8E2
const DARK = [0x0F, 0x0E, 0x0C];  // black #0F0E0C
const SOURCE_IMAGE = '/assets/images/Cowboy-Profile-from-Midjourney_1.avif';
const W = 360;
const H = 480;

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

type SourceMode = 'camera' | 'image';

export function CameraTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>('floyd-steinberg');
  const [flash, setFlash] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>('image');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stable ref for algorithm so the rAF loop always reads the latest
  const algorithmRef = useRef(algorithm);
  algorithmRef.current = algorithm;

  // Render a single frame from a CanvasImageSource
  const renderFrame = useCallback(
    (source: CanvasImageSource, algo: DitherAlgorithm) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(source, 0, 0, W, H);
      applyDither(ctx, W, H, algo);
    },
    []
  );

  // Load fallback image once on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = SOURCE_IMAGE;
    img.onload = () => {
      imageRef.current = img;
      // Only render if we're in image mode (initial state)
      if (sourceMode === 'image') {
        renderFrame(img, algorithm);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start webcam stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: W }, height: { ideal: H } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
        setSourceMode('camera');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(msg);
    }
  }, []);

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setSourceMode('image');
    // Re-render static image
    if (imageRef.current) {
      renderFrame(imageRef.current, algorithmRef.current);
    }
  }, [renderFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Live dither loop when camera is active
  useEffect(() => {
    if (sourceMode !== 'camera' || !cameraReady) return;
    const video = videoRef.current;
    if (!video) return;

    let running = true;
    const loop = () => {
      if (!running) return;
      renderFrame(video, algorithmRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [sourceMode, cameraReady, renderFrame]);

  // Re-render static image when algorithm changes (image mode only)
  useEffect(() => {
    if (sourceMode === 'image' && imageRef.current) {
      renderFrame(imageRef.current, algorithm);
    }
  }, [algorithm, sourceMode, renderFrame]);

  const handleCapture = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  };

  const toggleSource = () => {
    if (sourceMode === 'image') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hidden video element for webcam */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center bg-pure-black min-h-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Camera error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-pure-black/80 p-6 text-status-error text-center">
            <p>{cameraError}</p>
          </div>
        )}

        {/* Corner brackets */}
        <div className="absolute inset-4 pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-edge-muted" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-edge-muted" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-edge-muted" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-edge-muted" />
        </div>

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-[1px] bg-edge-muted" />
          <div className="absolute w-[1px] h-8 bg-edge-muted" />
        </div>

        {/* Live indicator */}
        {sourceMode === 'camera' && cameraReady && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-status-error animate-pulse" />
            <span className="font-mono text-xs text-status-error">LIVE</span>
          </div>
        )}

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
              className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-colors ${
                algorithm === id
                  ? 'bg-action-primary text-action-secondary'
                  : 'bg-surface-muted text-content-muted hover:text-content-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Capture + source toggle */}
        <div className="flex items-center justify-center gap-4">
          {/* Source toggle */}
          <button
            onClick={toggleSource}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              sourceMode === 'camera'
                ? 'bg-status-error/20 text-status-error border border-status-error/40'
                : 'bg-surface-muted text-content-muted hover:text-content-secondary border border-edge-muted'
            }`}
            aria-label={sourceMode === 'camera' ? 'Switch to image' : 'Use camera'}
          >
            <Icon name={sourceMode === 'camera' ? 'eye' : 'camera'} size={16} />
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            className="w-14 h-14 rounded-full border-4 border-edge-muted flex items-center justify-center hover:border-edge-primary transition-colors active:scale-95"
            aria-label="Capture"
          >
            <div className="w-10 h-10 rounded-full bg-surface-secondary" />
          </button>

          {/* Spacer for symmetry */}
          <div className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}
