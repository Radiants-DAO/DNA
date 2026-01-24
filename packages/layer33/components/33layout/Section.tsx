'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type SectionVariant = 'default' | 'hero' | 'staking-hero' | 'cta' | 'footer' | 'faq' | 'backstop';

interface SectionProps {
  /** Visual variant */
  variant?: SectionVariant;
  /** Additional className */
  className?: string;
  /** Section content */
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Section - Page section wrapper with consistent spacing and variants
 * 
 * @example
 * <Section variant="default">
 *   <h2>Content</h2>
 * </Section>
 * 
 * @example
 * <Section variant="cta">
 *   <p>Call to action content</p>
 * </Section>
 */
export function Section({ 
  variant = 'default', 
  className = '', 
  children 
}: SectionProps) {
  const baseClasses = 'block relative';
  
  const variantClasses: Record<SectionVariant, string> = {
    default: 'pt-32 pb-32',
    hero: 'min-h-[99dvh] pb-12',
    'staking-hero': 'min-h-[99dvh]',
    cta: 'section_cta',
    footer: 'section-footer',
    faq: 'pt-40 pb-40',
    backstop: 'section_home-backstop',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <section className={classes}>
      {children}
    </section>
  );
}

export default Section;
