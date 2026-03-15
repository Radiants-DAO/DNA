'use client';

import React from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';

// ============================================================================
// Types
// ============================================================================

type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

interface ScrollAreaRootProps {
  /** Content to be scrollable */
  children: React.ReactNode;
  /** Additional classes for the root container */
  className?: string;
  /** Which scrollbars to show */
  orientation?: ScrollAreaOrientation;
}

// ============================================================================
// Shared scrollbar classes
// ============================================================================

const scrollbarBase =
  'flex touch-none select-none transition-opacity duration-150 ease-out';

const scrollbarVertical = `${scrollbarBase} w-2 py-1 pr-1`;
const scrollbarHorizontal = `${scrollbarBase} h-2 flex-col px-1 pb-1`;

const thumbClasses =
  'relative flex-1 rounded-xs bg-edge-muted hover:bg-edge-primary transition-colors cursor-pointer';

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
      className={`overflow-hidden ${className}`.trim()}
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
      <BaseScrollArea.Thumb className={thumbClasses} />
    </BaseScrollArea.Scrollbar>
  );
}

function HorizontalScrollbar(): React.ReactNode {
  return (
    <BaseScrollArea.Scrollbar
      orientation="horizontal"
      className={scrollbarHorizontal}
    >
      <BaseScrollArea.Thumb className={thumbClasses} />
    </BaseScrollArea.Scrollbar>
  );
}

function Corner(): React.ReactNode {
  return <BaseScrollArea.Corner className="bg-surface-primary" />;
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
  orientation = 'vertical',
}: ScrollAreaRootProps): React.ReactNode {
  const showVertical = orientation === 'vertical' || orientation === 'both';
  const showHorizontal = orientation === 'horizontal' || orientation === 'both';

  return (
    <BaseScrollArea.Root
      data-rdna="scrollarea"
      className={`relative overflow-hidden ${className}`.trim()}
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
