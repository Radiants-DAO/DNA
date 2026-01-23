'use client';

import React from 'react';
import { DecorationDiv } from './DecorationDiv';

// ============================================================================
// Types
// ============================================================================

type DecorationOrientation = 'horizontal' | 'vertical';

interface DecorationGroupProps {
  /** Orientation of the decoration lines - horizontal or vertical */
  orientation?: DecorationOrientation;
  /** Number of decoration lines (1-5) */
  lineCount?: number;
  /** Width of each line */
  lineWidth?: string | number;
  /** Gap between lines */
  lineGap?: string | number;
  /** Position from top (percentage or CSS value) */
  top?: string | number;
  /** Position from bottom (percentage or CSS value) */
  bottom?: string | number;
  /** Position from left (percentage or CSS value) */
  left?: string | number;
  /** Position from right (percentage or CSS value) */
  right?: string | number;
  /** Background color class */
  bgColor?: string;
  /** Mix blend mode */
  mixBlendMode?: 'difference' | 'multiply' | 'screen' | 'overlay' | 'normal';
  /** Additional className for the container */
  className?: string;
  /** Transform for individual lines (e.g., 'translateX(-50%)' for centering) */
  lineTransform?: string;
  /** Starting position offset (useful for distributing lines) */
  startOffset?: string | number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DecorationGroup - A parent component that structures multiple decoration divs
 * 
 * @example
 * // Horizontal decoration group with 3 lines at top 15%, spaced 5% apart
 * <DecorationGroup 
 *   orientation="horizontal" 
 *   lineCount={3} 
 *   top="15%" 
 *   lineGap="5%" 
 *   left={0}
 *   lineTransform="translateX(-50%)"
 * />
 * 
 * @example
 * // Vertical decoration group with 3 lines on the left
 * <DecorationGroup 
 *   orientation="vertical" 
 *   lineCount={3} 
 *   left={0}
 *   lineGap="1em"
 * />
 */
export function DecorationGroup({
  orientation = 'horizontal',
  lineCount = 3,
  lineWidth,
  lineGap = '5%',
  top,
  bottom,
  left,
  right,
  bgColor = 'bg-white',
  mixBlendMode = 'difference',
  className = '',
  lineTransform,
  startOffset = 0,
}: DecorationGroupProps) {
  // Clamp lineCount between 1 and 5
  const count = Math.max(1, Math.min(5, lineCount));

  // Build container style - absolute positioning relative to parent
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
  };
  
  if (top !== undefined) {
    containerStyle.top = typeof top === 'number' ? `${top}px` : top;
  }
  if (bottom !== undefined) {
    containerStyle.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  }
  if (left !== undefined) {
    containerStyle.left = typeof left === 'number' ? `${left}px` : left;
  }
  if (right !== undefined) {
    containerStyle.right = typeof right === 'number' ? `${right}px` : right;
  }

  // Calculate positions for each line
  const gapValue = typeof lineGap === 'number' ? `${lineGap}px` : lineGap;
  const offsetValue = typeof startOffset === 'number' ? `${startOffset}px` : startOffset;

  return (
    <div className={className} style={containerStyle}>
      {Array.from({ length: count }, (_, index) => {
        // Calculate position based on index and gap
        // For horizontal lines: distribute vertically (top to bottom)
        // For vertical lines: distribute horizontally (left to right)
        const position = index === 0 
          ? (offsetValue || '0')
          : `calc(${offsetValue || '0'} + ${index} * ${gapValue})`;

        const lineProps: React.ComponentProps<typeof DecorationDiv> = {
          orientation,
          width: lineWidth,
          height: lineWidth,
          bgColor,
          mixBlendMode,
          transform: lineTransform,
        };

        // Position lines relative to container
        if (orientation === 'horizontal') {
          // Horizontal lines stacked vertically
          lineProps.top = position;
        } else {
          // Vertical lines stacked horizontally
          lineProps.left = position;
        }

        return <DecorationDiv key={index} {...lineProps} />;
      })}
    </div>
  );
}

export default DecorationGroup;
