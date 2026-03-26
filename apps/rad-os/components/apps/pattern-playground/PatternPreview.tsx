'use client';

import React, { useRef, useCallback, useState } from 'react';
import { Pattern } from '@rdna/radiants/components/core';
import type { PatternPlaygroundState } from './types';

interface PatternPreviewProps {
  state: PatternPlaygroundState;
}

// ============================================================================
// Mouse-follower panel — tracks cursor and sets --mouse-x/--mouse-y
// ============================================================================

function MouseFollowerPanel({
  state,
  dark,
  label,
}: {
  state: PatternPlaygroundState;
  dark?: boolean;
  label: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pressing, setPressing] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    // Move gradient off-screen so it fades to base color
    el.style.setProperty('--mouse-x', '-9999px');
    el.style.setProperty('--mouse-y', '-9999px');
    setPressing(false);
  }, []);

  const handleMouseDown = useCallback(() => setPressing(true), []);
  const handleMouseUp = useCallback(() => setPressing(false), []);

  const glowOverrides: React.CSSProperties | undefined = state.glowEnabled
    ? {
        '--pat-glow-shape': state.glowShape,
        '--pat-glow-color': state.glowCenter,
        '--pat-glow-mid': state.glowMid,
        '--pat-glow-mid-stop': `${state.glowMidStop}%`,
        '--pat-glow-radius': `${state.glowRadius}px`,
        '--pat-glow-base': state.glowBase,
      } as React.CSSProperties
    : undefined;

  const wrapperClasses = dark
    ? 'dark relative h-full pixel-rounded-sm bg-ink cursor-crosshair'
    : 'relative h-full pixel-rounded-sm cursor-crosshair';

  // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:dark-preview-container owner:design expires:2027-01-01 issue:DNA-001
  const labelClasses = dark
    ? 'absolute bottom-2 left-2 font-mono text-xs text-cream bg-ink/80 px-1.5 py-0.5 pixel-rounded-xs z-10'
    : 'absolute bottom-2 left-2 font-mono text-xs text-mute bg-page/80 px-1.5 py-0.5 pixel-rounded-xs z-10';

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <span className="font-heading text-xs text-mute uppercase tracking-wide">{label}</span>
      <div
        ref={panelRef}
        className={wrapperClasses}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={dark ? glowOverrides : undefined}
        {...(pressing && dark ? { 'data-pat-active': '' } : {})}
      >
        <Pattern
          pat={state.pat}
          color={state.color}
          bg={state.bg !== 'transparent' ? state.bg : undefined}
          scale={state.scale}
          style={{ position: 'absolute', inset: 0 }}
        />
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:dark-preview-label owner:design expires:2027-01-01 issue:DNA-001 */}
        <span className={labelClasses}>{label}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Preview — Sun / Moon side-by-side
// ============================================================================

export function PatternPreview({ state }: PatternPreviewProps) {
  return (
    <div className="h-full flex gap-3 p-4">
      <MouseFollowerPanel state={state} label="Sun" />
      <MouseFollowerPanel state={state} dark label="Moon" />
    </div>
  );
}
