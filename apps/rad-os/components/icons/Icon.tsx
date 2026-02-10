'use client';

import { memo, useEffect, useState } from 'react';

interface IconProps {
  /** Icon name (filename without .svg extension) */
  name: string;
  /** Icon size in pixels (applies to both width and height) */
  size?: number;
  /** Additional CSS classes for styling (use text-* for color) */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Icon component using SVG files from /assets/icons.
 * 
 * Icons automatically use currentColor, inheriting the parent's text color.
 * 
 * @example
 * ```tsx
 * // Inherits parent text color
 * <div className="text-blue-500">
 *   <Icon name="copy-to-clipboard" size={24} />
 * </div>
 * 
 * // Override color with className
 * <Icon name="checkmark" size={20} className="text-green-500" />
 * ```
 */

// Icon name aliases for backward compatibility
const ICON_ALIASES: Record<string, string> = {
  'refresh': 'refresh1',
  'settings': 'settings-cog',
  'lightning': 'electric',
  'information-circle': 'info-filled',
  'expand': 'full-screen',
  'collapse': 'minus', // Using minus as collapse icon
  'checkmark-filled': 'checkmark', // Fallback until we have filled variant
  'radiant': 'electric', // Radiant icon alias
};

function IconComponent({ 
  name, 
  size = 24, 
  className = '',
  'aria-label': ariaLabel,
}: IconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  // Resolve icon name through aliases
  const resolvedName = ICON_ALIASES[name] || name;
  const iconPath = `/assets/icons/${resolvedName}.svg`;

  useEffect(() => {
    fetch(iconPath)
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
        const originalWidth = widthMatch ? parseInt(widthMatch[1]) : 16;
        const originalHeight = heightMatch ? parseInt(heightMatch[1]) : 16;
        
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
        console.error(`Failed to load icon: ${name} (resolved: ${resolvedName})`, err);
        // Don't set svgContent, so it renders empty span
      });
  }, [name, resolvedName, iconPath, size]);

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

