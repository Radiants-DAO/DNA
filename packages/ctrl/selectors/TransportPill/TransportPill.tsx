'use client';

import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';

// =============================================================================
// TransportPill — Rounded pill housing N transport slots (prev / play / next / …)
//
// The pill paints a dark outer shell and renders each child inside an inset
// gradient "slot". First and last slots receive end-cap rounding; middle slots
// are squared. Children are rendered as-is — they provide their own icon.
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
  /** Emphasize a single slot (usually the play/pause). 0-indexed. */
  activeIndex?: number;
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
    'linear-gradient(in oklab, 180deg, oklab(21.4% .0009 0.002) 0%, oklab(16.4% .0004 0.004) 100%)',
  boxShadow:
    'oklch(0.9780 0.0295 94.34 / 0.33) 0px 1px 1px inset,' +
    ' oklch(0 0 0) 0px -1px 1px inset,' +
    ' oklch(0 0 0) 0px 0.5px 0.6px,' +
    ' oklch(0 0 0) 0px 2.9px 3.3px -0.4px',
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
  activeIndex,
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
        const isActive = activeIndex === i;
        const slotStyle: CSSProperties = {
          ...SLOT_BASE_STYLE,
          ...slotRadiusStyle(i === 0, i === last),
          filter: isActive ? 'brightness(0.9)' : undefined,
          boxShadow: isActive
            ? 'oklch(0 0 0) 0px 1px 5px inset'
            : SLOT_BASE_STYLE.boxShadow,
        };
        return (
          <div key={child.key ?? i} style={slotStyle} data-transport-slot={i}>
            {cloneElement(child as ReactElement)}
            {/* inner highlight blobs */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: -59,
                left: 18,
                width: 77,
                height: 77,
                borderRadius: '9999px',
                filter: 'blur(16px)',
                mixBlendMode: 'overlay',
                backgroundColor: 'oklch(0 0 0)',
                pointerEvents: 'none',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: -58,
                left: -27,
                width: 77,
                height: 77,
                borderRadius: '9999px',
                filter: 'blur(16px)',
                mixBlendMode: 'overlay',
                backgroundColor: isActive
                  ? 'oklch(1 0 0 / 0.1)'
                  : 'oklch(1 0 0 / 0.39)',
                pointerEvents: 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
