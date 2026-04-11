'use client';

import React from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { PixelBorder } from '../PixelBorder/PixelBorder';

// ============================================================================
// Types
// ============================================================================

type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

interface ScrollAreaRootProps {
  /** Content to be scrollable */
  children: React.ReactNode;
  /** Additional classes for the root container */
  className?: string;
  /** Inline styles for the root container */
  style?: React.CSSProperties;
  /** Which scrollbars to show */
  orientation?: ScrollAreaOrientation;
}

// ============================================================================
// Shared scrollbar classes
// ============================================================================

// Scrollbar: hidden by default, revealed on scroll or hover via Base UI data attrs
const scrollbarBase = [
  'flex touch-none select-none',
  'opacity-0 pointer-events-none',
  'transition-opacity duration-150 ease-out',
  'data-[scrolling]:opacity-100 data-[scrolling]:duration-0 data-[scrolling]:pointer-events-auto',
  'data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:pointer-events-auto',
].join(' ');

const scrollbarVertical = `${scrollbarBase} m-1 w-1.5 justify-center`;
const scrollbarHorizontal = `${scrollbarBase} m-1 h-1.5 flex-col items-center`;

// The thumb is wrapped in a <PixelBorder> via the `render` prop below. The
// `group/pixel` on the wrapper lets the bg layer flip on hover, while the
// inner div keeps base-ui's forwarded ref + inline height/width style so the
// scrollbar positioning math still works.
const thumbWrapperClasses = 'w-full cursor-pointer';
const thumbBgClasses = 'bg-line/40 group-hover/pixel:bg-line transition-colors';

// ============================================================================
// Sub-components
// ============================================================================

interface ViewportProps {
  children: React.ReactNode;
  className?: string;
}

function Viewport({ children, className = '' }: ViewportProps): React.ReactNode {
  return (
    <BaseScrollArea.Viewport
      className={`h-full ${className}`.trim()}
    >
      <BaseScrollArea.Content>
        {children}
      </BaseScrollArea.Content>
    </BaseScrollArea.Viewport>
  );
}

function VerticalScrollbar(): React.ReactNode {
  return (
    <BaseScrollArea.Scrollbar
      orientation="vertical"
      className={scrollbarVertical}
    >
      <BaseScrollArea.Thumb
        render={(props) => (
          <PixelBorder size="xs" background={thumbBgClasses} className={thumbWrapperClasses}>
            <div {...props} />
          </PixelBorder>
        )}
      />
    </BaseScrollArea.Scrollbar>
  );
}

function HorizontalScrollbar(): React.ReactNode {
  return (
    <BaseScrollArea.Scrollbar
      orientation="horizontal"
      className={scrollbarHorizontal}
    >
      <BaseScrollArea.Thumb
        render={(props) => (
          <PixelBorder size="xs" background={thumbBgClasses} className={thumbWrapperClasses}>
            <div {...props} />
          </PixelBorder>
        )}
      />
    </BaseScrollArea.Scrollbar>
  );
}

function Corner(): React.ReactNode {
  return <BaseScrollArea.Corner className="bg-page" />;
}

// ============================================================================
// Root component
// ============================================================================

/**
 * Custom-styled scroll area with themed scrollbars.
 * Wraps Base UI ScrollArea for accessible, cross-browser scrollbar styling.
 */
function Root({
  children,
  className = '',
  style,
  orientation = 'vertical',
}: ScrollAreaRootProps): React.ReactNode {
  const showVertical = orientation === 'vertical' || orientation === 'both';
  const showHorizontal = orientation === 'horizontal' || orientation === 'both';

  return (
    <BaseScrollArea.Root
      data-rdna="scrollarea"
      className={`relative overflow-hidden ${className}`.trim()}
      style={style}
    >
      <Viewport>{children}</Viewport>
      {showVertical && <VerticalScrollbar />}
      {showHorizontal && <HorizontalScrollbar />}
      {orientation === 'both' && <Corner />}
    </BaseScrollArea.Root>
  );
}

// ============================================================================
// ScrollArea — namespace API
// ============================================================================

export const ScrollArea = {
  Root,
  Viewport,
};

export default ScrollArea;
