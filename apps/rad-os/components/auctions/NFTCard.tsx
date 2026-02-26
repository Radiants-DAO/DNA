'use client';

import React from 'react';
import { Badge } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

type NFTCardVariant = 'default' | 'compact' | 'selectable';
type NFTCardSize = 'sm' | 'md' | 'lg';

interface NFTCardProps {
  /** NFT image URL */
  image?: string;
  /** NFT name */
  name: string;
  /** Collection name */
  collection?: string;
  /** Token ID or identifier */
  tokenId?: string;
  /** Floor price or value */
  price?: string;
  /** Price currency symbol */
  currency?: string;
  /** Visual variant */
  variant?: NFTCardVariant;
  /** Size preset */
  size?: NFTCardSize;
  /** Whether card is selected (for selectable variant) */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Selection change handler */
  onSelect?: (selected: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional classes */
  className?: string;
  /** Optional badge (e.g., "RARE", "1/1") */
  badge?: string;
  /** Optional attributes to display */
  attributes?: Array<{ trait_type: string; value: string }>;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  border border-edge-muted hover:border-edge-hover
  rounded-md
  overflow-hidden
  bg-surface-primary
  shadow-glow-md
`;

const sizeStyles: Record<NFTCardSize, {
  container: string;
  image: string;
  content: string;
  name: string;
  collection: string;
  price: string;
}> = {
  sm: {
    container: 'w-[120px]',
    image: 'aspect-square',
    content: 'p-2',
    name: 'font-mondwest text-sm truncate',
    collection: 'font-mono text-xs text-content-muted truncate',
    price: 'font-joystix text-xs',
  },
  md: {
    container: 'w-[180px]',
    image: 'aspect-square',
    content: 'p-3',
    name: 'font-mondwest text-sm truncate',
    collection: 'font-mono text-sm text-content-muted truncate',
    price: 'font-joystix text-sm',
  },
  lg: {
    container: 'w-[240px]',
    image: 'aspect-square',
    content: 'p-4',
    name: 'font-mondwest text-base truncate',
    collection: 'font-mono text-sm text-content-muted truncate',
    price: 'font-joystix text-sm',
  },
};

const variantStyles: Record<NFTCardVariant, string> = {
  default: '',
  compact: 'shadow-none',
  selectable: 'cursor-pointer hover:shadow-card transition-shadow',
};

// ============================================================================
// Component
// ============================================================================

/**
 * NFTCard component for displaying NFT items
 *
 * Features:
 * - Image with fallback placeholder
 * - Name, collection, and price display
 * - Selectable variant with checkbox
 * - Three size presets
 * - Optional badge and attributes
 */
export function NFTCard({
  image,
  name,
  collection,
  tokenId,
  price,
  currency = 'SOL',
  variant = 'default',
  size = 'md',
  selected = false,
  onClick,
  onSelect,
  disabled = false,
  className = '',
  badge,
  attributes,
}: NFTCardProps) {
  const styles = sizeStyles[size];

  const handleClick = () => {
    if (disabled) return;

    if (variant === 'selectable' && onSelect) {
      onSelect(!selected);
    } else if (onClick) {
      onClick();
    }
  };

  const containerClasses = [
    baseStyles,
    styles.container,
    variantStyles[variant],
    variant === 'selectable' && selected
      ? 'ring-2 ring-sun-yellow shadow-card'
      : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    onClick || (variant === 'selectable' && onSelect) ? 'cursor-pointer' : '',
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      role={onClick || onSelect ? 'button' : undefined}
      tabIndex={onClick || onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && (onClick || onSelect)) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Image */}
      <div className={`${styles.image} bg-surface-elevated border-b border-edge-primary relative`}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sun-yellow/20 to-sky-blue/20">
            <span className="text-4xl">🖼️</span>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 right-2">
            <Badge variant="warning" size="sm">
              {badge}
            </Badge>
          </div>
        )}

        {/* Selection checkbox for selectable variant */}
        {variant === 'selectable' && (
          <div className="absolute top-2 left-2">
            <div
              className={`
                w-5 h-5 border-2 border-edge-primary rounded-sm
                flex items-center justify-center
                ${selected ? 'bg-sun-yellow' : 'bg-surface-elevated'}
              `}
            >
              {selected && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <p title={name}>
          {name}
        </p>

        {collection && (
          <p title={collection}>
            {collection}
          </p>
        )}

        {tokenId && (
          <p>
            #{tokenId}
          </p>
        )}

        {/* Attributes (show max 2) */}
        {attributes && attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {attributes.slice(0, 2).map((attr, i) => (
              <Badge key={i} variant="default" size="sm">
                {attr.value}
              </Badge>
            ))}
            {attributes.length > 2 && (
              <Badge variant="default" size="sm">
                +{attributes.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="mt-2 flex items-center justify-between">
            <span className={styles.price}>
              {price} {currency}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default NFTCard;
