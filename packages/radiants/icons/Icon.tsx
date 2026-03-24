'use client';

import { memo, useEffect, useState } from 'react';
import type { IconSet } from './types';

interface IconProps {
  /** Icon name (filename without .svg extension) */
  name: string;
  /** Render size in pixels (applies to both width and height) */
  size?: number;
  /**
   * Which icon set to load from (16px pixel-art or 24px detailed).
   * Defaults based on size: ≤20 → 16, >20 → 24.
   * When switching sets, the name is resolved through ICON_16_TO_24 / ICON_24_TO_16 maps.
   */
  iconSet?: IconSet;
  /** Additional CSS classes for styling (use text-* for color) */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Base path for icon assets (default: /assets/icons) */
  basePath?: string;
}

// Icon name aliases for backward compatibility (within the 16px set)
const ICON_ALIASES: Record<string, string> = {
  refresh: 'refresh1',
  settings: 'settings-cog',
  lightning: 'electric',
  'information-circle': 'info-filled',
  expand: 'full-screen',
  collapse: 'minus',
  'checkmark-filled': 'checkmark',
  close: 'close',
  check: 'checkmark',
  copy: 'copy-to-clipboard',
  copied: 'copied-to-clipboard',
  trash: 'trash',
  comment: 'comments-blank',
  question: 'question',
  help: 'question',
  cursor: 'cursor2',
  'text-cursor': 'cursor-text',
  pencil: 'pencil',
  edit: 'pencil',
  eye: 'eye',
  'eye-off': 'eye-hidden',
  folder: 'folder-open',
  plus: 'plus',
  minus: 'minus',
  play: 'play',
  pause: 'pause',
  search: 'search',
  download: 'download',
  upload: 'upload',
  save: 'save',
  warning: 'warning-filled',
  info: 'info',
  globe: 'globe',
  home: 'home',
  menu: 'hamburger',
  radiant: 'electric',
  zap: 'electric',
  twitter: 'twitter',
  discord: 'discord',
  'radiants-logo': 'radiants-logo',
  radmark: 'radiants-logo',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'fill-bucket': 'fill-bucket',
  queue: 'queue',
  'resize-corner': 'resize-corner',
};

/**
 * Dynamic Icon component — loads SVGs at runtime from the appropriate size directory.
 *
 * Icons automatically use currentColor, inheriting the parent's text color.
 *
 * @example
 * ```tsx
 * // 16px pixel-art icon (default for small sizes)
 * <Icon name="search" size={16} />
 *
 * // 24px detailed icon (auto-selected for larger sizes)
 * <Icon name="search" size={24} />
 *
 * // Force a specific icon set regardless of render size
 * <Icon name="search" size={20} iconSet={24} />
 *
 * // Use a 24px-only icon directly
 * <Icon name="coding-apps-websites-database" size={24} />
 * ```
 */
function IconComponent({
  name,
  size = 16,
  iconSet,
  className = '',
  'aria-label': ariaLabel,
  basePath = '/assets/icons',
}: IconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // Determine which icon set to use
  const set: IconSet = iconSet ?? (size > 20 ? 24 : 16);

  // Resolve icon name through aliases (only for 16px set)
  const resolvedName = set === 16 ? (ICON_ALIASES[name] || name) : name;

  // Build the path: /assets/icons/16px/search.svg or /assets/icons/24px/interface-essential-search-1.svg
  const iconPath = `${basePath}/${set}px/${resolvedName}.svg`;

  useEffect(() => {
    const controller = new AbortController();

    fetch(iconPath, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load icon: ${name} (${res.status})`);
        }
        return res.text();
      })
      .then((text) => {
        // Remove XML declaration if present and trim whitespace
        const cleanedText = text.replace(/<\?xml[^>]*\?>\s*/i, '').trim();

        // Verify it's actually SVG content, not an HTML error page
        if (!cleanedText.startsWith('<svg')) {
          throw new Error(`Invalid icon format: ${name}`);
        }

        // Extract original width and height for viewBox if needed
        const widthMatch = cleanedText.match(/width=["'](\d+)["']/i);
        const heightMatch = cleanedText.match(/height=["'](\d+)["']/i);
        const originalWidth = widthMatch ? parseInt(widthMatch[1]) : set;
        const originalHeight = heightMatch ? parseInt(heightMatch[1]) : set;

        // Remove existing width and height attributes
        let svgProcessed = cleanedText.replace(
          /\s+(width|height)=["'][^"']*["']/gi,
          ''
        );

        // Check if viewBox exists, if not add it
        if (!svgProcessed.includes('viewBox=')) {
          svgProcessed = svgProcessed.replace(
            /<svg([^>]*)>/,
            `<svg$1 viewBox="0 0 ${originalWidth} ${originalHeight}">`
          );
        }

        // Set width to 100% and height to auto for responsive sizing
        const svgWithSize = svgProcessed.replace(
          /<svg([^>]*)>/,
          `<svg$1 width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style="display: block;">`
        );
        setSvgContent(svgWithSize);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(
            `Failed to load icon: ${name} (resolved: ${resolvedName}, set: ${set}px)`,
            err
          );
        }
      });

    return () => controller.abort();
  }, [name, resolvedName, iconPath, set]);

  if (!svgContent) {
    return (
      <span
        className={className}
        aria-label={ariaLabel}
        aria-hidden={!ariaLabel}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
        }}
      />
    );
  }

  return (
    <span
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        lineHeight: 0,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Memoize to prevent unnecessary re-renders
export const Icon = memo(IconComponent);
