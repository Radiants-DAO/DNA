'use client';

import { forwardRef } from 'react';
import { Icon } from '@rdna/radiants/icons/runtime';
import './TransportButton.css';

// =============================================================================
// TransportButton — Icon-only slot button designed to live inside a
// TransportPill (or render standalone in other skeuomorphic layouts).
//
// Intentionally minimal: the parent TransportPill owns the slot's shell,
// gradient, bevel, and pressed treatment. TransportButton is a transparent
// click target that paints only the icon glyph in the accent colour and wires
// pointer / click / focus behaviour.
//
// Pair with TransportPill's `pressedStates` to reflect play/pause state and
// momentary press (skip-back / skip-forward) animations.
//
//   <TransportPill pressedStates={[prevDown, isPlaying, nextDown]}>
//     <TransportButton label="Previous" iconName="skip-back"   onClick={prev} … />
//     <TransportButton label="Play"     iconName="play"        onClick={togglePlay} />
//     <TransportButton label="Next"     iconName="skip-forward" onClick={next} … />
//   </TransportPill>
// =============================================================================

export interface TransportButtonProps {
  /** Accessible label. Rendered as aria-label on the underlying <button>. */
  label: string;
  /** RDNA icon name — resolved via @rdna/radiants/icons/runtime. */
  iconName: string;
  /** Primary action callback (keyboard + pointer). */
  onClick?: () => void;
  /** Fires on pointer-down. Use for momentary pressed state (e.g. skip hold). */
  onPointerDown?: () => void;
  /**
   * Fires on pointer-up, pointer-leave, or pointer-cancel so callers don't
   * have to re-derive "pointer released or aborted" from three separate events.
   */
  onPointerUp?: () => void;
  /** Icon size. Icons are pixel-perfect at 16 or 24. Defaults to 16. */
  iconSize?: 16 | 24;
  /** Disable interactions. */
  disabled?: boolean;
  /** Extra class merged onto the button element. */
  className?: string;
}

export const TransportButton = forwardRef<HTMLButtonElement, TransportButtonProps>(
  function TransportButton(
    {
      label,
      iconName,
      onClick,
      onPointerDown,
      onPointerUp,
      iconSize = 16,
      disabled = false,
      className = '',
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        data-rdna="ctrl-transport-button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        className={['rdna-transport-button', className].filter(Boolean).join(' ')}
      >
        {iconSize === 24 ? <Icon name={iconName} large /> : <Icon name={iconName} />}
      </button>
    );
  },
);
