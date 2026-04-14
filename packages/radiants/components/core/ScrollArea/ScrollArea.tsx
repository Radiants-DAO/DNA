'use client';

import React from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { px } from '@rdna/pixel';

// ============================================================================
// Types
// ============================================================================

type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

interface ScrollAreaRootProps extends React.HTMLAttributes<HTMLDivElement> {
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

// Apply pixel corners directly to base-ui's Thumb element so its forwarded
// ref, event handlers, and inline positioning (transform/height) stay on the
// real thumb root. Wrapping the Thumb in <PixelBorder> breaks the positioning
// — PixelBorder doesn't forward those props.
// PIXEL_BORDER_RADII.xs was 4 — use px(4) which applies mask-image corners.
const thumbPixel = px(4);
const thumbClasses = `w-full bg-line/40 hover:bg-line transition-colors cursor-pointer ${thumbPixel.className}`;
const thumbStyle: React.CSSProperties = { ...thumbPixel.style };

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
      data-rdna="scrollarea-viewport"
      className={`h-full ${className}`.trim()}
    >
      <BaseScrollArea.Content data-rdna="scrollarea-content">
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
      <BaseScrollArea.Thumb className={thumbClasses} style={thumbStyle} />
    </BaseScrollArea.Scrollbar>
  );
}

function HorizontalScrollbar(): React.ReactNode {
  return (
    <BaseScrollArea.Scrollbar
      orientation="horizontal"
      className={scrollbarHorizontal}
    >
      <BaseScrollArea.Thumb className={thumbClasses} style={thumbStyle} />
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
  ...props
}: ScrollAreaRootProps): React.ReactNode {
  const showVertical = orientation === 'vertical' || orientation === 'both';
  const showHorizontal = orientation === 'horizontal' || orientation === 'both';

  return (
    <BaseScrollArea.Root
      data-rdna="scrollarea"
      className={`relative overflow-hidden ${className}`.trim()}
      style={style}
      {...props}
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
