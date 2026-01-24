'use client';

import React from 'react';
import Image from 'next/image';

// ============================================================================
// Types
// ============================================================================

interface MurderTreeItemProps {
  /** Image URL for the NFT */
  image?: string;
  /** NFT name (for alt text) */
  name?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * MurderTreeItem - Individual NFT display within the murder tree
 *
 * Matches the reference implementation pattern:
 * - Square aspect ratio image
 * - Border styling with hover glow effect
 * - Fallback for missing images
 */
export function MurderTreeItem({
  image,
  name = 'NFT',
  size = 'md',
  onClick,
  className = '',
}: MurderTreeItemProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 sm:w-20 sm:h-20',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  // Check for compromised shadow drive images
  const isCompromised = image?.includes('shdw') && !image?.includes('arweave');
  const displayImage = isCompromised ? '/no-image.svg' : image;

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        aspect-square
        border border-black
        bg-warm-cloud
        overflow-hidden
        transition-all duration-150
        hover:shadow-[0_0_8px_2px_var(--color-sun-yellow)]
        hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-sun-yellow
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
      type="button"
      disabled={!onClick}
    >
      {displayImage ? (
        <Image
          src={displayImage}
          alt={name}
          width={96}
          height={96}
          className="w-full h-full object-cover"
          quality={30}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/5">
          <span className="text-2xl opacity-30">?</span>
        </div>
      )}
    </button>
  );
}

export default MurderTreeItem;
