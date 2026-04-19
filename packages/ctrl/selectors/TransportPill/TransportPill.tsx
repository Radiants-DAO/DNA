'use client';

import { Children, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import './TransportPill.css';

// =============================================================================
// TransportPill — Rounded pill housing N transport slots (prev / play / next / …)
//
// The pill paints a dark outer shell and renders each child inside an inset
// gradient "slot". First and last slots receive end-cap rounding; middle slots
// are squared. Children are rendered as-is — they provide their own icon.
//
// Slot gradient + bevel are driven by CSS custom properties declared in
// TransportPill.css so they flip cleanly between light and dark modes:
//   --transport-slot-from / --transport-slot-to / --transport-slot-bevel
//
// Usage:
//   <TransportPill>
//     <button onClick={prev}><Icon name="skip-back" /></button>
//     <button onClick={playPause}><Icon name={playing ? 'pause' : 'play'} /></button>
//     <button onClick={next}><Icon name="skip-forward" /></button>
//   </TransportPill>
// =============================================================================

interface TransportPillProps {
  children: ReactNode;
  /** Height of the pill in px */
  height?: number;
  /** Per-slot pressed flag. Slot `i` renders with the inset/pressed shell when
   * `pressedStates[i]` is true. Use this for both toggle (e.g. play/pause) and
   * momentary (e.g. skip-back while pointer is down) states. */
  pressedStates?: boolean[];
  className?: string;
  style?: CSSProperties;
}

const SLOT_BASE_STYLE: CSSProperties = {
  flex: 1,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
  backgroundImage:
    'linear-gradient(in oklab 180deg, var(--transport-slot-from) 0%, var(--transport-slot-to) 100%)',
  boxShadow: 'var(--transport-slot-bevel)',
};

// Pressed-state slot: reverse the gradient so it appears LIGHTER (paper reference
// shows active slot brighter, not darker). Also apply a micro-depression.
const SLOT_PRESSED_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(in oklab 180deg, var(--transport-slot-to) 0%, var(--transport-slot-from) 100%)',
  boxShadow: 'oklch(0 0 0) 0 1px 5px inset',
  transform: 'translateY(0.5px)',
};

function slotRadiusStyle(isFirst: boolean, isLast: boolean): CSSProperties {
  if (isFirst && isLast) {
    return { borderRadius: 20 };
  }
  if (isFirst) {
    return {
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
      paddingLeft: 4,
    };
  }
  if (isLast) {
    return {
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 2,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      paddingRight: 4,
    };
  }
  return { borderRadius: 2 };
}

export function TransportPill({
  children,
  height = 40,
  pressedStates,
  className = '',
  style,
}: TransportPillProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const last = items.length - 1;

  return (
    <div
      data-rdna="ctrl-transport-pill"
      className={[
        'flex items-center justify-center',
        'bg-black rounded-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        height,
        padding: 2,
        gap: 2,
        backgroundColor: 'oklch(0 0 0)',
        ...style,
      }}
    >
      {items.map((child, i) => {
        const isPressed = Boolean(pressedStates?.[i]);
        const slotStyle: CSSProperties = {
          ...SLOT_BASE_STYLE,
          ...slotRadiusStyle(i === 0, i === last),
          ...(isPressed ? SLOT_PRESSED_STYLE : null),
          transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, background-image 80ms ease-out',
        };
        return (
          <div key={child.key ?? i} style={slotStyle} data-transport-slot={i}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
