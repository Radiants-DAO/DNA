'use client';

import React from 'react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation href (optional for current/last item) */
  href?: string;
}

interface BreadcrumbsProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator character */
  separator?: string;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Breadcrumbs component - Navigation hierarchy
 */
export function Breadcrumbs({
  items,
  separator = '/',
  className = '',
}: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 ${className}`.trim()}
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href || item.label} className="flex items-center gap-2">
              {/* Separator */}
              {index > 0 && (
                <span
                  className="font-space-mono text-sm text-neutral-neutral-3"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}

              {/* Item */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-alfacad text-sm uppercase text-neutral-neutral-3 hover:text-black hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`
                    font-alfacad text-sm uppercase
                    ${isLast ? 'text-black font-medium' : 'text-neutral-neutral-3'}
                  `.trim()}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
