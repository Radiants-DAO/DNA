'use client';

import { memo, useEffect, useState } from 'react';
import type { IconSet } from './types';
import { ICON_16_TO_24, ICON_24_TO_16 } from './size-map';

interface IconProps {
  /** Icon name (filename without .svg extension) */
  name: string;
  /** Render size in pixels (applies to both width and height) */
  size?: number;
  /**
   * Which icon set to load from (16px pixel-art or 24px detailed).
   * Defaults based on size: ≤20 → 16, >20 → 24.
   * When switching sets, names are auto-translated through the size map.
   * If no mapping exists, falls back to the 16px set.
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
 * Resolve icon name and set.
 *
 * When the target set is 24px and the name is a 16px name:
 *   - If a mapping exists in ICON_16_TO_24, use the 24px equivalent
 *   - If no mapping, fall back to 16px set (render the 16px icon at the larger size)
 *
 * When the target set is 16px and the name is a 24px name:
 *   - If a mapping exists in ICON_24_TO_16, use the 16px equivalent
 *   - If no mapping, keep as-is (will 404 if the name doesn't exist in 16px/)
 */
function resolveIcon(
  name: string,
  requestedSet: IconSet
): { resolvedName: string; resolvedSet: IconSet } {
  // First, resolve aliases (16px set only)
  const aliased = ICON_ALIASES[name] || name;

  if (requestedSet === 24) {
    // Check if this is a 16px name that has a 24px mapping
    if (aliased in ICON_16_TO_24) {
      return { resolvedName: ICON_16_TO_24[aliased], resolvedSet: 24 };
    }
    // Check if the name already exists as a 24px icon name (pass through)
    if (aliased in ICON_24_TO_16) {
      return { resolvedName: aliased, resolvedSet: 24 };
    }
    // No mapping found — fall back to 16px set
    return { resolvedName: aliased, resolvedSet: 16 };
  }

  if (requestedSet === 16) {
    // Check if this is a 24px name that has a 16px mapping
    if (aliased in ICON_24_TO_16) {
      return { resolvedName: ICON_24_TO_16[aliased], resolvedSet: 16 };
    }
    // Assume it's already a 16px name
    return { resolvedName: aliased, resolvedSet: 16 };
  }

  return { resolvedName: aliased, resolvedSet: requestedSet };
}

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
 * // 24px detailed icon (auto-selected, name auto-translated)
 * <Icon name="search" size={24} />
 *
 * // Force a specific icon set regardless of render size
 * <Icon name="search" size={20} iconSet={24} />
 *
 * // Use a 24px-only icon directly
 * <Icon name="coding-apps-websites-database" size={24} />
 *
 * // 16px icon with no 24px mapping — stays 16px even at larger size
 * <Icon name="chevron-left" size={24} />
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

  // Determine target set from size or explicit prop
  const requestedSet: IconSet = iconSet ?? (size > 20 ? 24 : 16);

  // Resolve name + set through aliases and size-map
  const { resolvedName, resolvedSet } = resolveIcon(name, requestedSet);

  // Build the path: /assets/icons/16px/search.svg or /assets/icons/24px/interface-essential-search-1.svg
  const iconPath = `${basePath}/${resolvedSet}px/${resolvedName}.svg`;

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
        const originalWidth = widthMatch
          ? parseInt(widthMatch[1])
          : resolvedSet;
        const originalHeight = heightMatch
          ? parseInt(heightMatch[1])
          : resolvedSet;

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

        // Replace hardcoded black fill/stroke values so icons inherit currentColor
        const svgColorFixed = svgWithSize
          .replace(/fill="(black|#000001|#000000|#000)"/gi, 'fill="currentColor"')
          .replace(/stroke="(black|#000001|#000000|#000)"/gi, 'stroke="currentColor"');

        setSvgContent(svgColorFixed);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(
            `Failed to load icon: ${name} (resolved: ${resolvedName}, set: ${resolvedSet}px)`,
            err
          );
        }
      });

    return () => controller.abort();
  }, [name, resolvedName, iconPath, resolvedSet]);

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
