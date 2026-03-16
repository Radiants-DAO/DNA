/**
 * @deprecated Use WindowContent, WindowTabs, WindowSidebar, or Web3Shell instead.
 * This component is retained for backward compatibility but should not be used in new code.
 */
'use client';

import React, { forwardRef } from 'react';

// ============================================================================
// Constants
// ============================================================================

/**
 * Window content sizing constraints.
 * These define the max dimensions before scrolling is enabled.
 */
export const WINDOW_CONTENT_CONSTRAINTS = {
  /** Maximum content height as percentage of viewport (0.7 = 70%) */
  maxHeightPercent: 0.7,
  /** Maximum content width as percentage of viewport (0.9 = 90%) */
  maxWidthPercent: 0.9,
  /** Taskbar height in pixels (bottom-12 = 48px) */
  taskbarHeight: 48,
  /** Title bar approximate height */
  titleBarHeight: 40,
  /** Tab bar approximate height */
  tabBarHeight: 48,
  /** Padding/margins adjustment */
  paddingAdjustment: 16,
} as const;

/**
 * Calculate the maximum content area height based on viewport.
 */
export function getMaxContentHeight(): number {
  if (typeof window === 'undefined') return 500;

  const { maxHeightPercent, taskbarHeight, titleBarHeight, tabBarHeight, paddingAdjustment } = WINDOW_CONTENT_CONSTRAINTS;
  const availableHeight = window.innerHeight - taskbarHeight;
  const maxWindowHeight = availableHeight * maxHeightPercent;

  // Subtract chrome (title bar, padding)
  return Math.floor(maxWindowHeight - titleBarHeight - paddingAdjustment);
}

/**
 * Calculate the maximum content area width based on viewport.
 */
export function getMaxContentWidth(): number {
  if (typeof window === 'undefined') return 800;

  const { maxWidthPercent, paddingAdjustment } = WINDOW_CONTENT_CONSTRAINTS;
  return Math.floor(window.innerWidth * maxWidthPercent - paddingAdjustment);
}

// ============================================================================
// Types
// ============================================================================

interface AppWindowContentProps {
  /** Content to render inside the scrollable area */
  children: React.ReactNode;
  /** Additional classes for the outer container */
  className?: string;
  /** Additional classes for the scroll container */
  scrollClassName?: string;
  /** Whether to show the border around content area */
  bordered?: boolean;
  /** Background color class */
  bgClassName?: string;
  /** Disable overflow/scrolling (for fixed-size content) */
  noScroll?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * AppWindowContent - Wrapper for app content inside AppWindow.
 *
 * Handles:
 * - Proper flex layout to fill available space
 * - Scroll container with max-height constraint (70% viewport)
 * - Consistent styling (border, background, rounded corners)
 *
 * @example
 * // Basic usage with tabs
 * <Tabs defaultValue="main" className="h-full flex flex-col">
 *   <AppWindowContent>
 *     <TabContent value="main">
 *       <div className="p-4">Your content here</div>
 *     </TabContent>
 *   </AppWindowContent>
 *   <TabList>
 *     <TabTrigger value="main">Main</TabTrigger>
 *   </TabList>
 * </Tabs>
 *
 * @example
 * // Without tabs
 * <AppWindowContent>
 *   <div className="p-4">Simple content</div>
 * </AppWindowContent>
 */
export const AppWindowContent = forwardRef<HTMLDivElement, AppWindowContentProps>(
  function AppWindowContent(
    {
      children,
      className = '',
      scrollClassName = '',
      bordered = true,
      bgClassName = 'bg-card',
      noScroll = false,
    },
    ref
  ) {
    const borderClasses = bordered ? 'border border-line rounded' : '';
    const scrollClasses = noScroll ? '' : 'overflow-auto';

    // The key insight: we need BOTH the outer wrapper AND the scroll container
    // to have max-height constraints for scrolling to work with fit-content windows.
    // The outer wrapper uses flex-1 min-h-0 for when the window has explicit height,
    // and the scroll container has explicit max-height for when window is fit-content.
    return (
      <div
        ref={ref}
        className={`flex-1 min-h-0 mx-2 ${className}`}
      >
        <div
          className={`h-full ${scrollClasses} ${borderClasses} ${bgClassName} ${scrollClassName}`}
          style={{
            // Explicit max-height ensures scrolling works even with fit-content parent
            // This CSS variable is set by AppWindow based on viewport constraints
            maxHeight: 'var(--app-content-max-height, none)',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

AppWindowContent.displayName = 'AppWindowContent';

export default AppWindowContent;
