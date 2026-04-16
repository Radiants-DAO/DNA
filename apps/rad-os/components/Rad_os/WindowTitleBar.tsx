'use client';

import React, { useState } from 'react';
import { Icon } from '@rdna/radiants/icons/runtime';
import { Separator, Tooltip, Button } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface ActionButtonConfig {
  /** Button text */
  text: string;
  /** Optional icon name (filename without .svg extension) */
  iconName?: string;
  /** Click handler (takes precedence over href) */
  onClick?: () => void;
  /** URL to navigate to */
  href?: string;
  /** Target for href navigation (e.g., '_blank') */
  target?: string;
}

interface WindowTitleBarProps {
  /** Window title text */
  title: string;
  /** Window ID for generating shareable links */
  windowId: string;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Additional className for styling */
  className?: string;
  /** Icon name (filename without .svg extension) to display before the title */
  iconName?: string;
  /** React icon component to display before the title (alternative to iconName) */
  icon?: React.ReactNode;

  // Visibility controls
  /** Show the window title (default: true) */
  showTitle?: boolean;
  /** Show the copy link button (default: true) */
  showCopyButton?: boolean;
  /** Show the close button (default: true) */
  showCloseButton?: boolean;
  /** Show the action button (default: false) */
  showActionButton?: boolean;
  /** Show the fullscreen button (default: true) */
  showFullscreenButton?: boolean;
  /** Show the widget mode button (default: false) */
  showWidgetButton?: boolean;

  // Action button configuration
  /** Configuration for the action button */
  actionButton?: ActionButtonConfig;

  // Fullscreen configuration
  /** Callback when fullscreen button is clicked */
  onFullscreen?: () => void;
  /** Whether the window is currently fullscreen (for icon toggle) */
  isFullscreen?: boolean;


  // Widget configuration
  /** Callback when widget button is clicked */
  onWidget?: () => void;
  /** Whether the window is currently in widget mode */
  isWidget?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Window title bar with configurable elements:
 * - Title (window name)
 * - Decorative divider line
 * - Action button (customizable CTA - wallet connect, external link, etc.)
 * - Fullscreen button (toggle)
 * - Copy link button
 * - Close button
 *
 * All elements have visibility controls and sensible defaults.
 *
 * @example
 * // Basic usage (title + fullscreen + copy + close)
 * <WindowTitleBar
 *   title="My App"
 *   windowId="my-app"
 *   onClose={handleClose}
 *   onFullscreen={handleFullscreen}
 * />
 *
 * @example
 * // With action button (external link)
 * <WindowTitleBar
 *   title="My App"
 *   windowId="my-app"
 *   onClose={handleClose}
 *   showActionButton
 *   actionButton={{
 *     text: "Visit Site",
 *     href: "https://example.com",
 *     target: "_blank"
 *   }}
 * />
 */
export function WindowTitleBar({
  title,
  windowId,
  onClose,
  className = '',
  iconName,
  icon,
  // Visibility controls with defaults
  showTitle = true,
  showCopyButton = true,
  showCloseButton = true,
  showActionButton = false,
  showFullscreenButton = true,
  showWidgetButton = false,
  // Action button config
  actionButton,
  // Fullscreen config
  onFullscreen,
  isFullscreen = false,
  // Widget config
  onWidget,
  isWidget = false,
}: WindowTitleBarProps) {
  const [copied, setCopied] = useState(false);
  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    
    const url = `${window.location.origin}${window.location.pathname}#${windowId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Failed to copy link
    }
  };

  // Handle action button click
  const handleActionClick = () => {
    if (!actionButton) return;
    
    if (actionButton.onClick) {
      actionButton.onClick();
    } else if (actionButton.href) {
      window.open(actionButton.href, actionButton.target || '_self');
    }
  };

  return (
    <>
      <div
        className={`
          flex items-center gap-3 pl-1 pr-4 py-1 h-fit
          cursor-move select-none
          ${className}
        `}
        data-drag-handle
        style={{ touchAction: 'none' }}
      >
        {/* All Buttons (left side) */}
        <div className="flex items-center gap-0 text-head pl-1.5">
          {/* Close Button */}
          {showCloseButton && (
            <Tooltip content="Close">
              <Button
                quiet
                tone="danger"
                size="sm"
                rounded="md"
                iconOnly={true}
                icon="close"
                onClick={onClose}
              />
            </Tooltip>
          )}

          {/* Fullscreen Button */}
          {showFullscreenButton && onFullscreen && (
            <Tooltip content={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              <Button
                quiet
                tone="accent"
                size="sm"
                rounded="md"
                iconOnly={true}
                icon={isFullscreen ? "collapse" : "expand"}
                onClick={onFullscreen}
              />
            </Tooltip>
          )}

          {/* Copy Link Button */}
          {showCopyButton && (
            <Tooltip content="Copy link">
              <Button
                quiet
                tone="success"
                size="sm"
                rounded="md"
                iconOnly={true}
                icon={copied ? "copied-to-clipboard" : "copy-to-clipboard"}
                onClick={handleCopyLink}
              />
            </Tooltip>
          )}

          {/* Widget Button */}
          {showWidgetButton && onWidget && (
            <Tooltip content={isWidget ? "Exit widget mode" : "Widget mode"}>
              <Button
                quiet
                size="md"
                iconOnly={true}
                icon="picture-in-picture"
                onClick={onWidget}
              />
            </Tooltip>
          )}

          {/* Action Button */}
          {showActionButton && actionButton && (
            <Button
              mode="pattern"
              size="sm"
              onClick={handleActionClick}
              icon={actionButton.iconName}
              className="shrink-0"
            >
              {actionButton.text}
            </Button>
          )}
        </div>

        {/* Decorative Line */}
        <div className="flex-1">
          <Separator />
        </div>

        {/* Title (right side) */}
        {showTitle && (
          <div className="flex items-center gap-2">
            {/* Render icon from React component or SVG name */}
            {icon ? (
              <span className="text-head">{icon}</span>
            ) : iconName ? (
              <Icon name={iconName} className="text-head" />
            ) : null}
            <span
              id={`window-title-${windowId}`}
              className="font-joystix text-xs uppercase tracking-tight text-head whitespace-nowrap"
            >
              {title}
            </span>
          </div>
        )}
      </div>

    </>
  );
}

export default WindowTitleBar;
