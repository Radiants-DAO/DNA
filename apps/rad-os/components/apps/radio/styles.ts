// =============================================================================
// Shared Radio LCD text styling. The filament look (pure-white fill + 3-layer
// sun-yellow/cream glow) is owned by @rdna/ctrl — see ctrl.css, which exposes
// --ctrl-lcd-text-color and --ctrl-lcd-text-shadow. This module just bundles
// those runtime tokens into a ready-to-spread CSSProperties object.
// =============================================================================

import type { CSSProperties } from 'react';

export const lcdText: CSSProperties = {
  color: 'var(--ctrl-lcd-text-color)',
  textShadow: 'var(--ctrl-lcd-text-shadow)',
};
