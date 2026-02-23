'use client';

import React from 'react';
import { MurderTreeItem } from './MurderTreeItem';

// ============================================================================
// Types
// ============================================================================

export interface MurderTreeNFT {
  id: string;
  name: string;
  image?: string;
  collection?: string;
  value?: number;
}

interface MurderTreeCollectionProps {
  /** Collection/branch title */
  title: string;
  /** Large NFT items (first 3) */
  bigNfts: MurderTreeNFT[];
  /** Small NFT items (next 4) */
  smallNfts: MurderTreeNFT[];
  /** Count of additional items beyond visible */
  additionalCount?: number;
  /** NFT click handler */
  onNftClick?: (nft: MurderTreeNFT) => void;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * MurderTreeCollection - A collection/branch within the murder tree
 *
 * Matches the reference implementation:
 * - Horizontal connecting line
 * - Collection title
 * - 3-column grid for big NFTs
 * - Row of smaller NFTs with "+N" counter
 * - Hover effect on wrapper
 */
export function MurderTreeCollection({
  title,
  bigNfts,
  smallNfts,
  additionalCount = 0,
  onNftClick,
  className = '',
}: MurderTreeCollectionProps) {
  return (
    <div className={`flex items-center max-w-[18em] ${className}`}>
      {/* Horizontal connecting line */}
      <div className="h-px min-w-4 bg-edge-primary flex-shrink-0" />

      {/* Collection wrapper */}
      <div
        className="
          relative
          flex flex-col
          p-1
          border border-edge-primary
          bg-surface-elevated
          transition-[box-shadow,transform] duration-150
          hover:shadow-card
          hover:-translate-x-0.5 hover:-translate-y-0.5
        "
      >
        {/* Collection title */}
        <div className="px-1 py-0.5">
          <span className="font-joystix text-xs uppercase text-content-primary">
            {title}
          </span>
        </div>

        {/* Big NFTs - 3 column grid */}
        {bigNfts.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {bigNfts.slice(0, 3).map((nft) => (
              <MurderTreeItem
                key={nft.id}
                image={nft.image}
                name={nft.name}
                size="md"
                onClick={onNftClick ? () => onNftClick(nft) : undefined}
              />
            ))}
          </div>
        )}

        {/* Small NFTs + counter row */}
        {(smallNfts.length > 0 || additionalCount > 0) && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex gap-1">
              {smallNfts.slice(0, 4).map((nft) => (
                <MurderTreeItem
                  key={nft.id}
                  image={nft.image}
                  name={nft.name}
                  size="sm"
                  onClick={onNftClick ? () => onNftClick(nft) : undefined}
                />
              ))}
            </div>

            {/* Additional count */}
            {additionalCount > 0 && (
              <span className="font-mondwest text-xs text-content-muted whitespace-nowrap">
                +{additionalCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MurderTreeCollection;
