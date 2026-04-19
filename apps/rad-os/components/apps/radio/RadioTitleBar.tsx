'use client';

import { Button, Tooltip, useAppWindowControls } from '@rdna/radiants/components/core';

// =============================================================================
// RadioTitleBar — Floating pill of AppWindow control buttons.
//
// Because the Radio renders chromeless, we draw our own titlebar as a small
// pill that floats above the widget. Controls come from the hosting AppWindow
// via `useAppWindowControls`.
// =============================================================================

interface RadioTitleBarProps {
  title: string;
  /** Absolute position relative to the RadioFrame */
  style?: React.CSSProperties;
  className?: string;
}

export function RadioTitleBar({ title, style, className = '' }: RadioTitleBarProps) {
  const ctrl = useAppWindowControls();
  if (!ctrl) return null;

  return (
    <div
      className={['absolute flex items-center gap-1 p-1 pl-1.5', className].filter(Boolean).join(' ')}
      style={{
        background: 'linear-gradient(180deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
        // Floating shadow + hairline ring so the pill stays legible against
        // the frame in light mode (where pill gradient ≈ frame gradient).
        boxShadow: 'var(--shadow-floating), 0 0 0 1px var(--color-line)',
        borderRadius: 9999,
        ...style,
      }}
      data-drag-handle=""
    >
      {ctrl.onClose && (
        <Tooltip content={`Close ${title}`}>
          <Button
            tone="danger"
            size="sm"
            rounded="sm"
            iconOnly
            icon="close"
            onClick={ctrl.onClose}
            aria-label={`Close ${title}`}
          />
        </Tooltip>
      )}
      {ctrl.onFullscreen && (
        <Tooltip content={ctrl.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          <Button
            tone="accent"
            size="sm"
            rounded="sm"
            iconOnly
            icon={ctrl.isFullscreen ? 'collapse' : 'expand'}
            onClick={ctrl.onFullscreen}
            aria-label={`${ctrl.isFullscreen ? 'Exit' : 'Enter'} fullscreen`}
          />
        </Tooltip>
      )}
      {ctrl.onWidget && (
        <Tooltip content={ctrl.widgetActive ? 'Exit widget mode' : 'Widget mode'}>
          <Button
            size="sm"
            iconOnly
            rounded="sm"
            icon="picture-in-picture"
            onClick={ctrl.onWidget}
            aria-label={`${ctrl.widgetActive ? 'Exit' : 'Enter'} widget mode`}
          />
        </Tooltip>
      )}
    </div>
  );
}
