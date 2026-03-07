'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dithering } from '@paper-design/shaders-react';

import { useAnimationPreferences } from '../hooks/useAnimationPreferences';

type DitheringShape = 'sphere' | 'wave' | 'dots' | 'ripple' | 'swirl' | 'warp';
type DitheringType = '2x2' | '4x4' | '8x8' | 'random';

interface ShaderSettings {
  colorBack: string;
  colorFront: string;
  shape: DitheringShape;
  type: DitheringType;
  size: number;
  speed: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export interface ShaderBackgroundProps {
  initialSettings?: Partial<ShaderSettings>;
  finalSettings?: Partial<ShaderSettings>;
  mobileSettings?: Partial<ShaderSettings>;
  animationDelay?: number;
  animationDuration?: number;
  desktopOpacity?: number;
  mobileBreakpoint?: number;
  mobileOpacity?: number;
  className?: string;
  animated?: boolean;
  liveMotion?: boolean;
  ambientAnimation?: boolean;
  ambientFrames?: number;
  ambientFps?: number;
  ambientFrameSpan?: number;
}

const HEX_COLORS = {
  ultraviolet: '#6939ca',
  magma: '#ef5c6f',
  amber: '#fd8f3a',
  green: '#14f1b2',
  black: '#010101',
} as const;

const DEFAULT_INITIAL_SETTINGS: ShaderSettings = {
  colorBack: HEX_COLORS.black,
  colorFront: HEX_COLORS.ultraviolet,
  shape: 'swirl',
  type: '8x8',
  size: 1.8,
  speed: 0.58,
  scale: 0.1,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};

const DEFAULT_FINAL_SETTINGS: ShaderSettings = {
  ...DEFAULT_INITIAL_SETTINGS,
  scale: 3.48,
};

const DEFAULT_MOBILE_SETTINGS: ShaderSettings = {
  colorBack: HEX_COLORS.black,
  colorFront: HEX_COLORS.ultraviolet,
  shape: 'warp',
  type: '8x8',
  size: 1.4,
  speed: 0.58,
  scale: 3.48,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};

const DESKTOP_FRAME_INTERVAL = 1000 / 20;
const DEFAULT_AMBIENT_FRAMES = 4;
const DEFAULT_AMBIENT_FPS = 4;
const DEFAULT_AMBIENT_FRAME_SPAN = 240;
const DESKTOP_MAX_PIXEL_COUNT = 1_500_000;
const MOBILE_MAX_PIXEL_COUNT = 900_000;
const SHADER_MIN_PIXEL_RATIO = 1;

const easeOutEnd = (t: number): number => {
  const easeStart = 0.8;
  if (t < easeStart) return t;
  const easeProgress = (t - easeStart) / (1 - easeStart);
  const easedPortion = 1 - Math.pow(1 - easeProgress, 3);
  return easeStart + easedPortion * (1 - easeStart);
};

const getDesktopInitialScale = (
  animated: boolean,
  finalScale: number,
  initialScale: number,
): number => {
  if (!animated) {
    return finalScale;
  }

  return initialScale;
};

const getDesktopInitialOpacity = (
  animated: boolean,
  desktopOpacity: number,
): number => {
  if (!animated) {
    return desktopOpacity;
  }

  return 0;
};

export function ShaderBackground({
  initialSettings,
  finalSettings,
  mobileSettings,
  animationDelay = 500,
  animationDuration = 15000,
  desktopOpacity = 1,
  mobileBreakpoint = 768,
  mobileOpacity = 0.26,
  className = '',
  animated = true,
  liveMotion = false,
  ambientAnimation = false,
  ambientFrames = DEFAULT_AMBIENT_FRAMES,
  ambientFps = DEFAULT_AMBIENT_FPS,
  ambientFrameSpan = DEFAULT_AMBIENT_FRAME_SPAN,
}: ShaderBackgroundProps) {
  const mergedInitial = useMemo(
    () => ({ ...DEFAULT_INITIAL_SETTINGS, ...initialSettings }),
    [initialSettings],
  );
  const mergedFinal = useMemo(
    () => ({ ...DEFAULT_FINAL_SETTINGS, ...finalSettings }),
    [finalSettings],
  );
  const mergedMobile = useMemo(
    () => ({ ...DEFAULT_MOBILE_SETTINGS, ...mobileSettings }),
    [mobileSettings],
  );

  const { isDocumentVisible, prefersReducedMotion } = useAnimationPreferences();

  const [isMobile, setIsMobile] = useState(false);
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(() =>
    getDesktopInitialScale(
      animated,
      mergedFinal.scale,
      mergedInitial.scale,
    ),
  );
  const [opacity, setOpacity] = useState(() =>
    getDesktopInitialOpacity(animated, desktopOpacity),
  );

  const frameElapsedRef = useRef(0);
  const animationElapsedRef = useRef(-animationDelay);
  const lastTickRef = useRef(0);

  const safeAmbientFrames = Math.max(1, Math.round(ambientFrames));
  const safeAmbientFps = Math.max(1, ambientFps);
  const safeAmbientFrameSpan = Math.max(0, ambientFrameSpan);
  const scaleDelta = mergedFinal.scale - mergedInitial.scale;
  const shouldAnimateDesktop =
    !isMobile && animated && !prefersReducedMotion && isDocumentVisible;
  const shouldAnimateAmbient =
    !isMobile && !animated && ambientAnimation && !prefersReducedMotion && isDocumentVisible;

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    const syncMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    syncMobile();
    mediaQuery.addEventListener('change', syncMobile);
    return () => mediaQuery.removeEventListener('change', syncMobile);
  }, [mobileBreakpoint]);

  useEffect(() => {
    lastTickRef.current = 0;

    if (isMobile) {
      frameElapsedRef.current = 0;
      animationElapsedRef.current = 0;
      setFrame(0);
      setScale(mergedMobile.scale);
      setOpacity(mobileOpacity);
      return;
    }

    if (prefersReducedMotion || !animated) {
      frameElapsedRef.current = 0;
      animationElapsedRef.current = 0;
      setFrame(0);
      setScale(mergedFinal.scale);
      setOpacity(desktopOpacity);

      if (!ambientAnimation) {
        return;
      }

      return;
    }

    frameElapsedRef.current = 0;
    animationElapsedRef.current = -animationDelay;
    setFrame(0);
    setScale(mergedInitial.scale);
    setOpacity(0);
  }, [
    animated,
    animationDelay,
    isMobile,
    mergedFinal.scale,
    mergedInitial.scale,
    mergedMobile.scale,
    desktopOpacity,
    mobileOpacity,
    ambientAnimation,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (!shouldAnimateDesktop && !shouldAnimateAmbient) return;

    let raf = 0;
    const minFrameInterval = shouldAnimateDesktop
      ? DESKTOP_FRAME_INTERVAL
      : 1000 / safeAmbientFps;
    const ambientLoopDuration = safeAmbientFrames * minFrameInterval;

    const animateFrame = (now: number) => {
      const lastTick = lastTickRef.current;
      if (lastTick !== 0 && now - lastTick < minFrameInterval) {
        raf = requestAnimationFrame(animateFrame);
        return;
      }

      const delta = lastTick === 0 ? minFrameInterval : now - lastTick;
      lastTickRef.current = now;

      if (shouldAnimateDesktop) {
        frameElapsedRef.current += delta * mergedInitial.speed;
        animationElapsedRef.current += delta;

        const animationTime = Math.max(0, animationElapsedRef.current);
        const linearProgress = Math.min(animationTime / Math.max(animationDuration, 1), 1);
        const easedProgress = easeOutEnd(linearProgress);

        setFrame(frameElapsedRef.current);

        if (linearProgress < 1) {
          setScale(mergedInitial.scale + scaleDelta * easedProgress);
          setOpacity(easedProgress * desktopOpacity);
        } else {
          setScale(mergedFinal.scale);
          setOpacity(desktopOpacity);
        }
      } else {
        frameElapsedRef.current += delta;
        const frameIndex = safeAmbientFrames === 1
          ? 0
          : Math.floor((frameElapsedRef.current % ambientLoopDuration) / minFrameInterval);
        const frameProgress = safeAmbientFrames === 1
          ? 0
          : frameIndex / (safeAmbientFrames - 1);
        setFrame(frameProgress * safeAmbientFrameSpan);
        setScale(mergedFinal.scale);
        setOpacity(desktopOpacity);
      }

      raf = requestAnimationFrame(animateFrame);
    };

    raf = requestAnimationFrame(animateFrame);
    return () => {
      cancelAnimationFrame(raf);
      lastTickRef.current = 0;
    };
  }, [
    animationDuration,
    desktopOpacity,
    mergedFinal.scale,
    mergedInitial.scale,
    mergedInitial.speed,
    scaleDelta,
    safeAmbientFps,
    safeAmbientFrameSpan,
    safeAmbientFrames,
    shouldAnimateAmbient,
    shouldAnimateDesktop,
  ]);

  const activeSettings = isMobile ? mergedMobile : mergedInitial;
  const shaderSpeed = isMobile || prefersReducedMotion
    ? 0
    : liveMotion
      ? activeSettings.speed
      : 0;

  return (
    <div
      className={`shader-background ${className}`.trim()}
      style={{ opacity }}
    >
      <Dithering
        colorBack={activeSettings.colorBack}
        colorFront={activeSettings.colorFront}
        shape={activeSettings.shape}
        type={activeSettings.type}
        size={activeSettings.size}
        speed={shaderSpeed}
        frame={frame}
        scale={scale}
        rotation={activeSettings.rotation}
        offsetX={activeSettings.offsetX}
        offsetY={activeSettings.offsetY}
        minPixelRatio={SHADER_MIN_PIXEL_RATIO}
        maxPixelCount={isMobile ? MOBILE_MAX_PIXEL_COUNT : DESKTOP_MAX_PIXEL_COUNT}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default ShaderBackground;
