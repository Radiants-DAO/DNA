'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Pattern } from '@rdna/radiants/components/core';
import type { PatternPlaygroundState } from './types';

interface PatternPreviewProps {
  state: PatternPlaygroundState;
}

const SPRING = { type: 'spring' as const, visualDuration: 0.2, bounce: 0.1 };

function PreviewTile({
  label,
  state,
  whileHover,
  whileTap,
}: {
  label: string;
  state: PatternPlaygroundState;
  whileHover?: Record<string, number>;
  whileTap?: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-heading text-xs text-mute uppercase tracking-wide">{label}</span>
      <div className="aspect-square">
        <motion.div
          className="relative w-full h-full pixel-rounded-sm cursor-pointer"
          whileHover={whileHover}
          whileTap={whileTap}
          transition={SPRING}
        >
          <Pattern
            pat={state.pat}
            color={state.color}
            bg={state.bg !== 'transparent' ? state.bg : undefined}
            scale={state.scale}
            style={{ position: 'absolute', inset: 0 }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export function PatternPreview({ state }: PatternPreviewProps) {
  const hoverAnim = {
    scale: state.hoverScale,
    opacity: state.hoverOpacity,
  };

  const pressedAnim = {
    scale: state.pressedScale,
    y: state.pressedTranslateY,
  };

  const glowStyle: React.CSSProperties | undefined = state.glowEnabled
    ? {
        '--pat-glow-center': state.glowCenter,
        '--pat-glow-spread': `${state.glowSpread}%`,
        '--pat-glow-fade': `${state.glowFade}%`,
      } as React.CSSProperties
    : undefined;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* ── Interactive previews ── */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-3 gap-3 h-full">
          <PreviewTile label="Default" state={state} />
          <PreviewTile label="Hover" state={{
            ...state,
            color: state.hoverColor,
            bg: state.hoverBg,
          }} whileHover={hoverAnim} />
          <PreviewTile label="Pressed" state={{
            ...state,
            color: state.pressedColor,
            bg: state.pressedBg,
          }} whileTap={pressedAnim} />
        </div>
      </div>

      {/* ── Light / Dark comparison ── */}
      <div>
        <span className="font-heading text-xs text-mute uppercase tracking-wide block mb-2">
          Light / Dark Mode
        </span>
        <div className="grid grid-cols-2 gap-3">
          {/* Light */}
          <div className="h-28 relative pixel-rounded-sm">
            <Pattern
              pat={state.pat}
              color={state.color}
              bg={state.bg !== 'transparent' ? state.bg : undefined}
              scale={state.scale}
              style={{ position: 'absolute', inset: 0 }}
            />
            <span className="absolute bottom-2 left-2 font-mono text-xs text-mute bg-page/80 px-1.5 py-0.5 pixel-rounded-xs">
              Sun
            </span>
          </div>

          {/* Dark */}
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:dark-preview-panel owner:design expires:2027-01-01 issue:DNA-001 */}
          <div className="dark h-28 relative pixel-rounded-sm bg-ink">
            <Pattern
              pat={state.pat}
              color={state.color}
              bg={state.bg !== 'transparent' ? state.bg : undefined}
              scale={state.scale}
              style={{
                position: 'absolute',
                inset: 0,
                ...glowStyle,
              }}
            />
            {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:dark-preview-label owner:design expires:2027-01-01 issue:DNA-001 */}
            <span className="absolute bottom-2 left-2 font-mono text-xs text-cream bg-ink/80 px-1.5 py-0.5 pixel-rounded-xs">
              Moon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
