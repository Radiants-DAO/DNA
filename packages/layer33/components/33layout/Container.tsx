'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type ContainerSize = 'xsmall' | 'small' | 'medium' | 'large';

interface ContainerProps {
  /** Container size variant */
  size?: ContainerSize;
  /** Additional className */
  className?: string;
  /** Container content */
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Container - Max-width container wrapper for consistent content width
 * 
 * @example
 * <Container size="large">
 *   <h2>Content</h2>
 * </Container>
 */
export function Container({ 
  size = 'large', 
  className = '', 
  children 
}: ContainerProps) {
  const sizeClasses: Record<ContainerSize, string> = {
    xsmall: 'w-full max-w-[32rem] mx-auto',
    small: 'w-full max-w-[32rem] mx-auto',
    medium: 'w-full max-w-[64rem] mx-auto',
    large: 'w-full max-w-[77rem] mx-auto',
  };

  const classes = `${sizeClasses[size]} ${className}`.trim();

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

export default Container;
