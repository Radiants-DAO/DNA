'use client';

import { useState, useEffect, memo } from 'react';

interface IconProps {
  /** Icon filename without .svg extension (e.g., "arrow-right" or "block-arrows-arrowheads-right") */
  name: string;
  /** Icon size in pixels (applies to both width and height) */
  size?: number;
  /** Additional CSS classes for styling (use text-* for color) */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

// ============================================================================
// Icon Name Aliases - Map legacy names to block icon names
// ============================================================================

const ICON_ALIASES: Record<string, string> = {
  // Arrows
  'arrow-right': 'block-arrows-arrowheads-right',
  'arrow-left': 'block-arrows-arrowheads-left',
  'chevron-down': 'block-arrows-arrowheads-down',
  'chevron-right': 'block-arrows-arrowheads-right-chevron',
  'expand': 'block-arrows-other-arrows-expand',
  
  // Interface Essential - Basic UI
  'close': 'block-interface-essential-basic-ui-delete-2',
  'plus': 'block-interface-essential-basic-ui-add',
  'search': 'block-interface-essential-basic-ui-search',
  'settings': 'block-interface-essential-basic-ui-settings',
  'home': 'block-interface-essential-basic-ui-home',
  'home-outline': 'block-interface-essential-basic-ui-home',
  'question': 'block-interface-essential-basic-ui-question',
  'question-block': 'block-interface-essential-basic-ui-question-2',
  'locked': 'block-interface-essential-basic-ui-lock',
  'unlocked': 'block-interface-essential-basic-ui-unlock',
  'download': 'block-interface-essential-basic-ui-download',
  'not-allowed': 'block-interface-essential-basic-ui-forbidden',
  'avatar': 'block-interface-essential-basic-ui-user',
  'information': 'block-commerce-shopping-help-information',
  'information-circle': 'block-commerce-shopping-help-information',
  
  // Interface Essential - Content
  'copy': 'block-interface-essential-content-copy',
  'checkmark': 'block-interface-essential-basic-ui-check',
  'checkmark-filled': 'block-interface-essential-basic-ui-check-2',
  'save': 'block-interface-essential-content-save',
  'trash': 'block-interface-essential-basic-ui-bin',
  'trash-open': 'block-interface-essential-basic-ui-bin',
  'trash-full': 'block-interface-essential-basic-ui-bin',
  'folder-closed': 'block-interface-essential-content-folder',
  'folder-open': 'block-interface-essential-content-folder',
  'file-blank': 'block-interface-essential-content-file',
  'file-image': 'block-interface-essential-content-image',
  'file-written': 'block-interface-essential-content-file',
  
  // Interface Essential - Other UI
  'refresh': 'block-arrows-other-arrows-refresh',
  'refresh-block': 'block-arrows-other-arrows-refresh',
  'wrench': 'block-interface-essential-other-ui-wrench',
  
  // Wellness/Nature
  'lightning': 'block-wellness-nature-lightning',
  'power': 'block-wellness-nature-lightning',
  'power-thin': 'block-wellness-nature-lightning',
  
  // Warnings
  'warning': 'block-interface-essential-basic-ui-exclamation',
  'warning-triangle-filled': 'block-interface-essential-basic-ui-exclamation-2',
  'warning-triangle-filled-2': 'block-interface-essential-basic-ui-exclamation-2',
  'warning-triangle-lines': 'block-interface-essential-basic-ui-exclamation',
  'waring-triangle-filled': 'block-interface-essential-basic-ui-exclamation-2',
  
  // Time
  'hourglass': 'block-interface-essential-basic-ui-time',
  
  // Navigation
  'hamburger': 'block-interface-essential-text-formatting-bulleted-list',
};

/**
 * Resolves an icon name to the actual file name.
 * If the name is an alias, returns the mapped block icon name.
 * Otherwise returns the original name (for direct block icon usage or custom icons).
 */
function resolveIconName(name: string): string {
  return ICON_ALIASES[name] || name;
}

/**
 * Runtime SVG icon loader with automatic currentColor support.
 * 
 * Icons are loaded from /assets/icons/{name}.svg and automatically
 * processed to use currentColor for fills, inheriting the parent's
 * text color.
 * 
 * Supports both legacy icon names (which are aliased to block icons)
 * and direct block icon names.
 * 
 * @example
 * ```tsx
 * // Using legacy name (auto-mapped to block icon)
 * <Icon name="arrow-right" size={24} />
 * 
 * // Using block icon directly
 * <Icon name="block-arrows-arrowheads-right" size={24} />
 * 
 * // Override color with className
 * <Icon name="checkmark" size={20} className="text-green-500" />
 * ```
 */
function IconComponent({ 
  name, 
  size = 24, 
  className = '',
  'aria-label': ariaLabel,
}: IconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  
  // Resolve aliases to actual icon file names
  const resolvedName = resolveIconName(name);

  useEffect(() => {
    let mounted = true;

    const loadIcon = async () => {
      try {
        const response = await fetch(`/assets/icons/${resolvedName}.svg`);
        
        if (!response.ok) {
          throw new Error(`Icon not found: ${name}`);
        }

        const svgText = await response.text();
        
        if (!mounted) return;

        // Process SVG to use currentColor for theming
        let processed = svgText;
        
        // Check if SVG uses CSS classes (like .st0 with fill: currentColor)
        const usesCssClasses = processed.includes('<style>') && processed.includes('currentColor');
        
        if (!usesCssClasses) {
          // Only process fill/stroke attributes if not using CSS classes
          // Remove existing fill attributes (except none)
          processed = processed.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');
          // Remove existing stroke attributes (except none)  
          processed = processed.replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"');
          
          // Add fill="currentColor" to root svg if no fill exists
          if (!processed.includes('fill=')) {
            processed = processed.replace(/<svg([^>]*)>/, `<svg$1 fill="currentColor">`);
          }
        }
        
        // Set dimensions (always do this, preserving viewBox)
        // Parse the SVG tag more carefully to avoid breaking structure
        const svgTagMatch = processed.match(/<svg([^>]*)>/);
        if (svgTagMatch) {
          let svgAttrs = svgTagMatch[1];
          
          // Extract and preserve viewBox (critical for CSS-based fills to work correctly)
          const viewBoxMatch = svgAttrs.match(/viewBox="[^"]*"/);
          const viewBox = viewBoxMatch ? viewBoxMatch[0] : null;
          
          // Remove existing width/height attributes
          svgAttrs = svgAttrs.replace(/\s*width="[^"]*"/g, '');
          svgAttrs = svgAttrs.replace(/\s*height="[^"]*"/g, '');
          
          // Clean up extra spaces
          svgAttrs = svgAttrs.trim().replace(/\s+/g, ' ');
          
          // Build new attributes: preserve viewBox first, then add width/height
          const newAttrs = [];
          if (viewBox) {
            newAttrs.push(viewBox);
          }
          newAttrs.push(`width="${size}"`, `height="${size}"`);
          
          // Add any remaining attributes
          const remainingAttrs = svgAttrs
            .replace(/viewBox="[^"]*"/g, '')
            .trim();
          if (remainingAttrs) {
            newAttrs.push(remainingAttrs);
          }
          
          // Reconstruct the SVG tag with proper spacing
          processed = processed.replace(/<svg[^>]*>/, `<svg ${newAttrs.join(' ')}>`);
        }

        setSvgContent(processed);
        setError(false);
      } catch (e) {
        if (mounted) {
          setError(true);
        }
      }
    };

    loadIcon();

    return () => {
      mounted = false;
    };
  }, [resolvedName, size]);

  // Mapping of icon names to fallback characters (supports both legacy and block icon names)
  const ICON_FALLBACKS: Record<string, string> = {
    // Legacy icon name fallbacks
    'close': '×',
    'check': '✓',
    'checkmark': '✓',
    'checkmark-filled': '✓',
    'arrow-left': '←',
    'arrow-right': '→',
    'chevron-down': '▼',
    'plus': '+',
    'minus': '−',
    'search': '○',
    'settings': '⚙',
    'home': '⌂',
    'home-outline': '⌂',
    'folder-closed': '▷',
    'folder-open': '▼',
    'file-blank': '□',
    'file-image': '▣',
    'file-written': '▤',
    'trash': '×',
    'trash-open': '×',
    'trash-full': '×',
    'power': '⚡',
    'power-thin': '⚡',
    'locked': '🔒',
    'unlocked': '🔓',
    'save': '💾',
    'download': '↓',
    'copy': '⧉',
    'refresh': '↻',
    'refresh-block': '↻',
    'information': 'ℹ',
    'information-circle': 'ℹ',
    'warning': '⚠',
    'warning-triangle-filled': '⚠',
    'warning-triangle-filled-2': '⚠',
    'warning-triangle-lines': '⚠',
    'waring-triangle-filled': '⚠',
    'question': '?',
    'question-block': '?',
    'expand': '▶',
    'hamburger': '☰',
    'avatar': '○',
    'lightning': '⚡',
    'not-allowed': '⊘',
    'hourglass': '⏳',
    'wrench': '🔧',
    
    // Block icon fallbacks (by category)
    // Arrows
    'block-arrows-arrowheads-right': '→',
    'block-arrows-arrowheads-left': '←',
    'block-arrows-arrowheads-up': '↑',
    'block-arrows-arrowheads-down': '↓',
    'block-arrows-arrowheads-right-chevron': '▶',
    'block-arrows-arrowheads-left-chevron': '◀',
    'block-arrows-arrowheads-up-chevron': '▲',
    'block-arrows-arrowheads-down-chevron': '▼',
    'block-arrows-other-arrows-expand': '⤢',
    'block-arrows-other-arrows-refresh': '↻',
    'block-arrows-other-arrows-synchronize': '⇄',
    
    // Interface Essential - Basic UI
    'block-interface-essential-basic-ui-add': '+',
    'block-interface-essential-basic-ui-add-2': '+',
    'block-interface-essential-basic-ui-remove': '−',
    'block-interface-essential-basic-ui-delete': '×',
    'block-interface-essential-basic-ui-delete-2': '×',
    'block-interface-essential-basic-ui-check': '✓',
    'block-interface-essential-basic-ui-check-2': '✓',
    'block-interface-essential-basic-ui-search': '○',
    'block-interface-essential-basic-ui-settings': '⚙',
    'block-interface-essential-basic-ui-settings-2': '⚙',
    'block-interface-essential-basic-ui-home': '⌂',
    'block-interface-essential-basic-ui-user': '○',
    'block-interface-essential-basic-ui-user-2': '○',
    'block-interface-essential-basic-ui-lock': '🔒',
    'block-interface-essential-basic-ui-unlock': '🔓',
    'block-interface-essential-basic-ui-download': '↓',
    'block-interface-essential-basic-ui-upload': '↑',
    'block-interface-essential-basic-ui-question': '?',
    'block-interface-essential-basic-ui-question-2': '?',
    'block-interface-essential-basic-ui-exclamation': '⚠',
    'block-interface-essential-basic-ui-exclamation-2': '⚠',
    'block-interface-essential-basic-ui-forbidden': '⊘',
    'block-interface-essential-basic-ui-bin': '×',
    'block-interface-essential-basic-ui-time': '⏳',
    'block-interface-essential-basic-ui-time-2': '⏳',
    
    // Interface Essential - Content
    'block-interface-essential-content-copy': '⧉',
    'block-interface-essential-content-save': '💾',
    'block-interface-essential-content-file': '□',
    'block-interface-essential-content-folder': '▷',
    'block-interface-essential-content-image': '▣',
    'block-interface-essential-content-edit': '✏',
    'block-interface-essential-content-share': '⤴',
    
    // Interface Essential - Other UI
    'block-interface-essential-other-ui-wrench': '🔧',
    'block-interface-essential-other-ui-light-bulb': '💡',
    'block-interface-essential-other-ui-mail': '✉',
    
    // Commerce
    'block-commerce-shopping-help-information': 'ℹ',
    'block-commerce-money-wallet': '💰',
    'block-commerce-money-coin': '●',
    
    // Wellness/Nature
    'block-wellness-nature-lightning': '⚡',
    'block-wellness-nature-sun': '☀',
    'block-wellness-nature-moon': '☽',
    
    // Text formatting
    'block-interface-essential-text-formatting-bulleted-list': '☰',
  };

  if (error || !svgContent) {
    // Get fallback character - check both original and resolved names
    const fallbackChar = ICON_FALLBACKS[name] || ICON_FALLBACKS[resolvedName] || '?';
    
    return (
      <span
        className={`font-space-mono ${className}`}
        style={{ 
          display: 'inline-flex', 
          width: size, 
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.8, // Slightly smaller than container for padding
          lineHeight: 1,
        }}
        role="img"
        aria-label={ariaLabel}
        aria-hidden={!ariaLabel}
      >
        {fallbackChar}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ 
        display: 'inline-flex', 
        width: size, 
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Memoize to prevent unnecessary re-renders and re-fetches
export const Icon = memo(IconComponent);

