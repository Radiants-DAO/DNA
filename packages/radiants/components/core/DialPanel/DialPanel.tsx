'use client';

/**
 * DialPanel — RDNA wrapper around DialKit
 *
 * Provides an inline or popover parameter-tuning panel with RDNA styling
 * baked in. Import this instead of `dialkit` directly.
 *
 * Use `header` to inject content (pickers, presets, etc.) above the
 * DialKit controls. Everything scrolls together in one sidebar.
 *
 * @example
 * ```tsx
 * import { DialPanel, useDialKit } from '@rdna/radiants/components/core';
 *
 * function MyControls() {
 *   const params = useDialKit('My Panel', {
 *     size: [16, 8, 64, 1],
 *     enabled: true,
 *   });
 *   return <div style={{ fontSize: params.size }}>...</div>;
 * }
 *
 * function App() {
 *   return (
 *     <div className="flex h-full">
 *       <DialPanel header={<MyPresetButtons />}>
 *         <MyControls />
 *       </DialPanel>
 *       <main>...</main>
 *     </div>
 *   );
 * }
 * ```
 *
 * @see https://github.com/joshpuckett/dialkit
 */

import React from 'react';
import { DialRoot } from 'dialkit';

// DialKit base styles + RDNA theme override (order matters)
import 'dialkit/styles.css';
import './dialkit-rdna.css';

export interface DialPanelProps {
  /** Panel rendering mode. Default: 'inline' */
  mode?: 'inline' | 'popover';
  /** Popover position (only for popover mode). Default: 'top-right' */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether popover starts open. Default: true */
  defaultOpen?: boolean;
  /** Content rendered above DialKit controls (presets, pickers, etc.) */
  header?: React.ReactNode;
  /** Content rendered below DialKit controls */
  footer?: React.ReactNode;
  /** Children rendered alongside DialRoot (useDialKit hook components) */
  children?: React.ReactNode;
  /** Width of the panel. Default: 'w-64' */
  width?: string;
  /** Additional className for the outer container */
  className?: string;
}

export function DialPanel({
  mode = 'inline',
  position,
  defaultOpen,
  header,
  footer,
  children,
  width = 'w-64',
  className = '',
}: DialPanelProps) {
  return (
    <div className={`${width} shrink-0 border-r border-rule flex flex-col overflow-hidden ${className}`}>
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto [&_.dialkit-panel]:!bg-transparent [&_.dialkit-panel]:!border-0 [&_.dialkit-panel]:!shadow-none">
        <DialRoot
          mode={mode}
          {...(position ? { position } : {})}
          {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        />
        {children}
      </div>
      {footer}
    </div>
  );
}

// Re-export the hook so consumers don't need a separate dialkit import
export { useDialKit } from 'dialkit';
export type { DialConfig, ResolvedValues, SpringConfig } from 'dialkit';
