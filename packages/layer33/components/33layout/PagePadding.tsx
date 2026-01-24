'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface PagePaddingProps {
  /** Additional className */
  className?: string;
  /** Content */
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PagePadding - Horizontal padding wrapper for page content
 * 
 * @example
 * <PagePadding>
 *   <Container size="large">
 *     <h2>Content</h2>
 *   </Container>
 * </PagePadding>
 */
export function PagePadding({ 
  className = '', 
  children 
}: PagePaddingProps) {
  const classes = `px-10 block relative ${className}`.trim();

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

export default PagePadding;
