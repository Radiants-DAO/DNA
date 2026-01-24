'use client';

import { useState, useEffect, memo } from 'react';

interface LogoProps {
  /** Logo variant: 'logomark' (icon) or 'wordmark' (text) */
  variant: 'logomark' | 'wordmark';
  /** Height of the logo (e.g., '1.25rem', '1.6rem') */
  height?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Whether to use blend mode (defaults to true) */
  useBlendMode?: boolean;
}

/**
 * Logo component that loads SVGs from /assets/logos/ and ensures
 * proper white fill + mix-blend-difference for visibility on any background.
 * 
 * Designed to be extensible - additional SVG variants can be added easily.
 * 
 * @example
 * ```tsx
 * <Logo variant="logomark" height="1.25rem" className="text-white" />
 * <Logo variant="wordmark" height="1.6rem" className="text-white" />
 * ```
 */
function LogoComponent({ 
  variant, 
  height = 'auto', 
  className = '',
  'aria-label': ariaLabel,
  useBlendMode = true,
}: LogoProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadLogo = async () => {
      try {
        const response = await fetch(`/assets/logos/${variant}.svg`);
        
        if (!response.ok) {
          throw new Error(`Logo not found: ${variant}`);
        }

        const svgText = await response.text();
        
        if (!mounted) return;

        // Process SVG to ensure white fill and remove any background rects
        let processed = svgText;
        
        // Remove white background rects (common in wordmark SVGs)
        processed = processed.replace(/<rect[^>]*fill="white"[^>]*\/?>/gi, '');
        processed = processed.replace(/<rect[^>]*fill='white'[^>]*\/?>/gi, '');
        
        // Replace all fill="black" with fill="currentColor" (or white if needed)
        processed = processed.replace(/fill="black"/gi, 'fill="currentColor"');
        processed = processed.replace(/fill='black'/gi, "fill='currentColor'");
        
        // Ensure root SVG has fill="currentColor" if no fill exists
        if (!processed.includes('fill=') || processed.match(/<svg[^>]*fill="none"/i)) {
          // Only add fill if SVG doesn't explicitly set fill="none"
          if (!processed.match(/<svg[^>]*fill="none"/i)) {
            processed = processed.replace(/<svg([^>]*)>/, `<svg$1 fill="currentColor">`);
          }
        }
        
        // Set height while preserving viewBox
        const svgTagMatch = processed.match(/<svg([^>]*)>/);
        if (svgTagMatch) {
          let svgAttrs = svgTagMatch[1];
          
          // Extract and preserve viewBox
          const viewBoxMatch = svgAttrs.match(/viewBox="[^"]*"/);
          const viewBox = viewBoxMatch ? viewBoxMatch[0] : null;
          
          // Remove existing width/height attributes
          svgAttrs = svgAttrs.replace(/\s*width="[^"]*"/gi, '');
          svgAttrs = svgAttrs.replace(/\s*height="[^"]*"/gi, '');
          
          // Clean up extra spaces
          svgAttrs = svgAttrs.trim().replace(/\s+/g, ' ');
          
          // Build new attributes: preserve viewBox, add height
          const newAttrs = [];
          if (viewBox) {
            newAttrs.push(viewBox);
          }
          if (height !== 'auto') {
            newAttrs.push(`height="${height}"`);
          }
          
          // Add any remaining attributes
          const remainingAttrs = svgAttrs
            .replace(/viewBox="[^"]*"/gi, '')
            .trim();
          if (remainingAttrs) {
            newAttrs.push(remainingAttrs);
          }
          
          // Reconstruct the SVG tag
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

    loadLogo();

    return () => {
      mounted = false;
    };
  }, [variant, height]);

  if (error || !svgContent) {
    return (
      <span
        className={`${className}`}
        style={{ 
          display: 'inline-flex', 
          height: height !== 'auto' ? height : '1.25rem',
          alignItems: 'center',
        }}
        role="img"
        aria-label={ariaLabel}
        aria-hidden={!ariaLabel}
      >
        {variant === 'logomark' ? '33' : 'LAYER33'}
      </span>
    );
  }

  return (
    <span
      className={`${useBlendMode ? 'mix-blend-difference' : ''} ${className}`}
      style={{ 
        display: 'inline-flex', 
        height: height !== 'auto' ? height : '1.25rem',
        alignItems: 'center',
      }}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Memoize to prevent unnecessary re-renders and re-fetches
export const Logo = memo(LogoComponent);
