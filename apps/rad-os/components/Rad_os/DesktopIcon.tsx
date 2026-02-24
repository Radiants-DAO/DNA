'use client';

import React from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_REGISTRY } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

export type IconVariant = 'list' | 'macos' | 'win95' | 'neon';

export const ICON_VARIANTS: IconVariant[] = ['list', 'macos', 'win95', 'neon'];

export const ICON_VARIANT_LABELS: Record<IconVariant, string> = {
  list: 'Radiants',
  macos: 'macOS',
  win95: 'Win95',
  neon: 'Neon',
};

interface DesktopIconProps {
  /** App ID for window management */
  appId: string;
  /** Display label */
  label: string;
  /** Icon React node */
  icon: React.ReactNode;
  /** Visual variant */
  variant?: IconVariant;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DesktopIcon({
  appId,
  label,
  icon,
  variant = 'list',
  className = '',
}: DesktopIconProps) {
  const { openWindow, isWindowOpen } = useWindowManager();

  const handleClick = () => {
    const config = APP_REGISTRY[appId as keyof typeof APP_REGISTRY];
    openWindow(appId, config?.defaultSize);
  };

  const isActive = isWindowOpen(appId);

  switch (variant) {
    // ──────────────────────────────────────────────────────────────────────
    // macOS Classic — vertical centered, larger rounded icon, label below
    // ──────────────────────────────────────────────────────────────────────
    case 'macos':
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            flex flex-col items-center gap-1
            p-2 rounded-lg w-20
            hover:bg-hover-overlay
            active:bg-edge-muted
            transition-colors
            ${isActive ? 'bg-surface-secondary/40' : ''}
            ${className}
          `}
          title={label}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-secondary text-sun-yellow shadow-sm">
            {icon}
          </div>
          <span className={`
            font-joystix text-[9px] uppercase text-center
            leading-tight w-full
            ${isActive ? 'text-sun-yellow' : 'text-content-primary'}
          `}>
            {label}
          </span>
        </button>
      );

    // ──────────────────────────────────────────────────────────────────────
    // Windows 95 — beveled 3D borders, system feel, no rounded corners
    // ──────────────────────────────────────────────────────────────────────
    case 'win95':
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            flex flex-row items-center gap-2
            px-1.5 py-0.5 w-fit
            border-2
            ${isActive
              ? 'border-t-black/30 border-l-black/30 border-b-white/40 border-r-white/40 bg-surface-secondary/20'
              : 'border-t-white/40 border-l-white/40 border-b-black/30 border-r-black/30'
            }
            hover:bg-hover-overlay/50
            active:border-t-black/40 active:border-l-black/40
            active:border-b-white/50 active:border-r-white/50
            ${className}
          `}
          title={label}
        >
          <div className="w-7 h-7 flex items-center justify-center bg-surface-secondary text-sun-yellow">
            {icon}
          </div>
          <span className={`
            font-joystix text-[11px] uppercase tracking-wider whitespace-nowrap pr-1
            ${isActive ? 'text-sun-yellow' : 'text-content-primary'}
          `}>
            {label}
          </span>
        </button>
      );

    // ──────────────────────────────────────────────────────────────────────
    // Radiants Neon — circular icon containers, glow effects
    // ──────────────────────────────────────────────────────────────────────
    case 'neon':
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            group flex flex-row items-center gap-3
            rounded-sm w-fit px-1 py-0.5
            hover:bg-hover-overlay/30
            active:bg-edge-muted
            ${isActive ? 'bg-hover-overlay/20' : ''}
            ${className}
          `}
          title={label}
        >
          <div className={`
            w-9 h-9 flex items-center justify-center
            rounded-full border
            text-sun-yellow
            transition-shadow duration-200
            ${isActive
              ? 'border-sun-yellow shadow-[0_0_10px_rgba(252,225,132,0.4)]'
              : 'border-sun-yellow/40 group-hover:shadow-[0_0_8px_rgba(252,225,132,0.3)] group-hover:border-sun-yellow/70'
            }
          `}>
            {icon}
          </div>
          <span className={`
            font-joystix text-xs uppercase tracking-wider whitespace-nowrap pr-2
            transition-all duration-200
            ${isActive
              ? 'text-sun-yellow [text-shadow:0_0_8px_rgba(252,225,132,0.5)]'
              : 'text-content-primary group-hover:[text-shadow:0_0_6px_rgba(252,225,132,0.3)]'
            }
          `}>
            {label}
          </span>
        </button>
      );

    // ──────────────────────────────────────────────────────────────────────
    // Radiants List (default) — horizontal row, square icon box
    // ──────────────────────────────────────────────────────────────────────
    default:
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`
            flex flex-row items-center gap-2
            rounded-sm
            w-fit
            hover:bg-hover-overlay
            active:bg-edge-muted
            ${isActive ? 'bg-surface-secondary' : ''}
            ${className}
          `}
          title={label}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-surface-secondary rounded-sm text-sun-yellow">
            {icon}
          </div>
          <span className={`
            font-joystix text-xs
            uppercase tracking-wider
            whitespace-nowrap
            pr-2
            ${isActive ? 'text-sun-yellow' : 'text-content-primary'}
          `}>
            {label}
          </span>
        </button>
      );
  }
}

export default DesktopIcon;
