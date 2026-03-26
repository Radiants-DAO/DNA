'use client';

/**
 * DialPanel — RDNA wrapper around DialKit
 *
 * Provides an inline or popover parameter-tuning panel with RDNA styling
 * baked in. Import this instead of `dialkit` directly.
 *
 * @example
 * ```tsx
 * import { DialPanel, useDialKit } from '@rdna/radiants/components/core';
 *
 * function MyControls() {
 *   const params = useDialKit('My Panel', {
 *     size: [16, 8, 64, 1],
 *     color: '#FCE184',
 *     enabled: true,
 *   });
 *   return <div style={{ fontSize: params.size }}>...</div>;
 * }
 *
 * function App() {
 *   return (
 *     <div className="flex">
 *       <DialPanel />
 *       <MyControls />
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
}

export function DialPanel({
  mode = 'inline',
  position,
  defaultOpen,
}: DialPanelProps) {
  return (
    <DialRoot
      mode={mode}
      {...(position ? { position } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
    />
  );
}

// Re-export the hook so consumers don't need a separate dialkit import
export { useDialKit } from 'dialkit';
export type { DialConfig, ResolvedValues, SpringConfig } from 'dialkit';
