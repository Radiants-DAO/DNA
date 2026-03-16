'use client';

import React, { useState } from 'react';
import { Icon } from '@rdna/radiants/icons';
import { Divider, HelpPanel, Tooltip, Button } from '@rdna/radiants/components/core';

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
  /** Show the help button (default: false) */
  showHelpButton?: boolean;
  /** Show the action button (default: false) */
  showActionButton?: boolean;
  /** Show the fullscreen button (default: true) */
  showFullscreenButton?: boolean;
  /** Show the mock states button - dev mode only (default: false) */
  showMockStatesButton?: boolean;
  /** Show the widget mode button (default: false) */
  showWidgetButton?: boolean;

  // Help panel configuration
  /** Help content to display in the help panel */
  helpContent?: React.ReactNode;
  /** Title for the help panel */
  helpTitle?: string;

  // Action button configuration
  /** Configuration for the action button */
  actionButton?: ActionButtonConfig;

  // Fullscreen configuration
  /** Callback when fullscreen button is clicked */
  onFullscreen?: () => void;
  /** Whether the window is currently fullscreen (for icon toggle) */
  isFullscreen?: boolean;

  // Mock states configuration
  /** Callback when mock states button is clicked */
  onMockStatesClick?: () => void;

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
 * - Help button (opens contextual help panel)
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
 * // With help panel
 * <WindowTitleBar
 *   title="My App"
 *   windowId="my-app"
 *   onClose={handleClose}
 *   showHelpButton
 *   helpContent={<p>This is how to use the app...</p>}
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
  showHelpButton = false,
  showActionButton = false,
  showFullscreenButton = true,
  showMockStatesButton = false,
  showWidgetButton = false,
  // Help panel config
  helpContent,
  helpTitle = 'Help',
  // Action button config
  actionButton,
  // Fullscreen config
  onFullscreen,
  isFullscreen = false,
  // Mock states config
  onMockStatesClick,
  // Widget config
  onWidget,
  isWidget = false,
}: WindowTitleBarProps) {
  const [copied, setCopied] = useState(false);
  const helpPanel = HelpPanel.useHelpPanelState();

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    
    const url = `${window.location.origin}${window.location.pathname}#${windowId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
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
          flex items-center gap-3 pl-4 pr-1 py-1 h-fit
          cursor-move select-none
          ${className}
        `}
        data-drag-handle
      >
        {/* Title */}
        {showTitle && (
          <div className="flex items-center gap-2">
            {/* Render icon from React component or SVG name */}
            {icon ? (
              <span className="text-head">{icon}</span>
            ) : iconName ? (
              <Icon name={iconName} size={16} className="text-head" />
            ) : null}
            <span
              id={`window-title-${windowId}`}
              className="font-joystix text-xs uppercase tracking-tight text-head whitespace-nowrap"
            >
              {title}
            </span>
          </div>
        )}

        {/* Decorative Line */}
        <div className="flex-1">
          <Divider />
        </div>

        {/* All Buttons */}
        <div className="flex items-center gap-0 text-head">
          {/* Action Button */}
          {showActionButton && actionButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleActionClick}
              icon={actionButton.iconName ? <Icon name={actionButton.iconName} size={14} /> : undefined}
              className="shrink-0"
            >
              {actionButton.text}
            </Button>
          )}

          {/* Help Button */}
          {showHelpButton && (
            <Tooltip content="Help">
              <Button
                variant="ghost"
                size="md"
                iconOnly={true}
                icon={<Icon name="question" size={20} />}
                onClick={helpPanel.actions.toggle}
              />
            </Tooltip>
          )}

          {/* Mock States Button - Dev mode only */}
          {showMockStatesButton && onMockStatesClick && (
            <Tooltip content="Mock States">
              <Button
                variant="ghost"
                size="md"
                iconOnly={true}
                icon={<Icon name="wrench" size={20} />}
                onClick={onMockStatesClick}
              />
            </Tooltip>
          )}

          {/* Widget Button */}
          {showWidgetButton && onWidget && (
            <Tooltip content={isWidget ? "Exit widget mode" : "Widget mode"}>
              <Button
                variant="ghost"
                size="md"
                iconOnly={true}
                icon={<Icon name="picture-in-picture" size={20} />}
                onClick={onWidget}
              />
            </Tooltip>
          )}

          {/* Fullscreen Button */}
          {showFullscreenButton && onFullscreen && (
            <Tooltip content={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              <Button
                variant="ghost"
                size="md"
                iconOnly={true}
                icon={<Icon name={isFullscreen ? "collapse" : "expand"} size={20} />}
                onClick={onFullscreen}
              />
            </Tooltip>
          )}

          {/* Copy Link Button */}
          {showCopyButton && (
            <Tooltip content="Copy link">
              <Button
                variant="ghost"
                size="md"
                iconOnly={true}
                icon={<Icon name={copied ? "copied-to-clipboard" : "copy-to-clipboard"} size={20} />}
                onClick={handleCopyLink}
              />
            </Tooltip>
          )}

          {/* Close Button */}
          {showCloseButton && (
            <Tooltip content="Close">
              <Button
                variant="ghost"
                size="md"
                iconOnly={true}
                icon={<Icon name="close" size={20} />}
                onClick={onClose}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Help Panel (renders as overlay within window) */}
      {showHelpButton && (
        <HelpPanel.Provider state={helpPanel.state} actions={helpPanel.actions}>
          <HelpPanel.Content title={helpTitle}>
            {helpContent || (
              <p>
                No help content available for this window.
              </p>
            )}
          </HelpPanel.Content>
        </HelpPanel.Provider>
      )}
    </>
  );
}

export default WindowTitleBar;
