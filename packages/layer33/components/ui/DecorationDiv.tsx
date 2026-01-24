'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type DecorationOrientation = 'horizontal' | 'vertical';

interface DecorationDivProps {
  /** Orientation of the decoration - horizontal or vertical */
  orientation?: DecorationOrientation;
  /** Position from top (percentage or CSS value) */
  top?: string | number;
  /** Position from bottom (percentage or CSS value) */
  bottom?: string | number;
  /** Position from left (percentage or CSS value) */
  left?: string | number;
  /** Position from right (percentage or CSS value) */
  right?: string | number;
  /** Width of the decoration */
  width?: string | number;
  /** Height of the decoration */
  height?: string | number;
  /** Background color class */
  bgColor?: string;
  /** Mix blend mode */
  mixBlendMode?: 'difference' | 'multiply' | 'screen' | 'overlay' | 'normal';
  /** Additional className */
  className?: string;
  /** Transform (e.g., 'translateX(-50%)' for centering) */
  transform?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DecorationDiv - A reusable decoration element component
 * 
 * @example
 * // Horizontal decoration at top 15%
 * <DecorationDiv orientation="horizontal" top="15%" />
 * 
 * @example
 * // Vertical decoration on the left, centered
 * <DecorationDiv orientation="vertical" left={0} transform="translateX(-50%)" />
 */
export function DecorationDiv({
  orientation = 'horizontal',
  top,
  bottom,
  left,
  right,
  width,
  height,
  bgColor = 'bg-white',
  mixBlendMode = 'difference',
  className = '',
  transform,
}: DecorationDivProps) {
  // Default dimensions based on orientation
  const defaultWidth = orientation === 'horizontal' ? '5rem' : '0.25rem';
  const defaultHeight = orientation === 'horizontal' ? '0.25rem' : '5rem';

  const finalWidth = width ?? defaultWidth;
  const finalHeight = height ?? defaultHeight;

  // Build style object
  const style: React.CSSProperties = {
    width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
    height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
  };

  if (top !== undefined) {
    style.top = typeof top === 'number' ? `${top}px` : top;
  }
  if (bottom !== undefined) {
    style.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  }
  if (left !== undefined) {
    style.left = typeof left === 'number' ? `${left}px` : left;
  }
  if (right !== undefined) {
    style.right = typeof right === 'number' ? `${right}px` : right;
  }
  if (transform) {
    style.transform = transform;
  }

  // Build className
  const mixBlendClass = `mix-blend-${mixBlendMode}`;
  const classes = `${bgColor} ${mixBlendClass} absolute ${className}`.trim();

  return <div className={classes} style={style} />;
}

export default DecorationDiv;
