'use client';

import { useEffect, useRef, useState } from 'react';
import { useRadOSStore } from '@/store';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const STEP_COUNT = 6;
const STEP_INTERVAL = 25; // ms between each new rect

/**
 * System 7–style "zoom rectangles" overlay.
 *
 * Renders stepping black-outline rectangles that expand from an icon's
 * position to the target window position, then opens the window.
 */
export function ZoomRects() {
  const zoomAnimation = useRadOSStore((s) => s.zoomAnimation);
  const clearZoomAnimation = useRadOSStore((s) => s.clearZoomAnimation);
  const openWindow = useRadOSStore((s) => s.openWindow);
  const reduceMotion = useRadOSStore((s) => s.reduceMotion);
  const [activeStep, setActiveStep] = useState(-1);
  const animIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!zoomAnimation) return;

    const { appId } = zoomAnimation;
    animIdRef.current = appId;

    // Skip animation if reduce motion is on
    if (reduceMotion) {
      openWindow(appId);
      clearZoomAnimation();
      return;
    }

    setActiveStep(0);
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= STEP_COUNT) {
        clearInterval(interval);
        // Brief pause so the final rect is visible, then open
        setTimeout(() => {
          openWindow(appId);
          clearZoomAnimation();
          setActiveStep(-1);
        }, 40);
      } else {
        setActiveStep(step);
      }
    }, STEP_INTERVAL);

    return () => {
      clearInterval(interval);
      // If interrupted (rapid clicks), still open the queued window
      if (animIdRef.current === appId) {
        openWindow(appId);
        clearZoomAnimation();
      }
      setActiveStep(-1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger only on new animation
  }, [zoomAnimation]);

  if (!zoomAnimation || activeStep < 0) return null;

  const { from, to } = zoomAnimation;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const t = i / (STEP_COUNT - 1);
        // Show current step + 2 trailing for the ghosting effect
        const visible = i <= activeStep && i >= activeStep - 2;
        if (!visible) return null;

        return (
          <div
            key={i}
            className="absolute border-2 border-inv"
            style={{
              left: lerp(from.x, to.x, t),
              top: lerp(from.y, to.y, t),
              width: lerp(from.width, to.width, t),
              height: lerp(from.height, to.height, t),
            }}
          />
        );
      })}
    </div>
  );
}
