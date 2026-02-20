'use client';

import React from 'react';
import Image from 'next/image';
import { MurderTreeCollection, type MurderTreeNFT } from './MurderTreeCollection';
import { Icon } from '@/components/icons';

// ============================================================================
// Types
// ============================================================================

export interface MurderTreeBranch {
  title: string;
  nfts: MurderTreeNFT[];
}

interface FullMurderTreeProps {
  /** Radiant NFT image URL */
  radiantImage: string;
  /** Radiant name */
  radiantName?: string;
  /** Array of branches/collections to display */
  branches: MurderTreeBranch[];
  /** NFT click handler */
  onNftClick?: (nft: MurderTreeNFT) => void;
  /** Hide the radiant image (for inline display where image is already shown) */
  hideRadiantImage?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Helper: Split NFTs into big/small for display
// ============================================================================

function splitNftsForDisplay(nfts: MurderTreeNFT[]) {
  return {
    bigNfts: nfts.slice(0, 3),
    smallNfts: nfts.slice(3, 7),
    additionalCount: Math.max(0, nfts.length - 7),
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * FullMurderTree - Complete murder tree visualization
 *
 * Matches the reference implementation:
 * - Radiant image at top center with glowing box shadow
 * - Vertical connecting line down from radiant
 * - Multiple collection blocks showing burned/collected NFTs
 * - Tree structure flowing top-down
 */
export function FullMurderTree({
  radiantImage,
  radiantName = 'Radiant',
  branches,
  onNftClick,
  hideRadiantImage = false,
  className = '',
}: FullMurderTreeProps) {
  return (
    <div className={`flex flex-col items-start justify-center py-4 ${className}`}>
      {/* Radiant at top - conditionally hidden for inline display */}
      {!hideRadiantImage && (
        <div className="flex flex-col items-center gap-2 pt-4">
          {/* Radiant image with glow */}
          <div
            className="
              relative
              max-w-[18em]
              mb-8
              flex flex-col items-center
            "
          >
            {/* Image container with glow */}
            <div className="shadow-[0_0_16px_0_var(--color-cream)]">
              <Image
                src={radiantImage}
                alt={radiantName}
                width={288}
                height={288}
                className="border border-black"
                priority
              />
            </div>

            {/* Vertical connecting line from radiant */}
            <div
              className="
                absolute
                bottom-[-2em]
                left-1/2
                -translate-x-1/2
                w-px h-12
                bg-black
                flex justify-center items-center
              "
            >
              {/* Radiant icon on the line */}
              <div
                className="
                  absolute
                  bottom-[-0.75em]
                  z-10
                  w-6 h-6
                  p-0.5
                  flex items-center justify-center
                  bg-cream
                "
              >
                <Icon name="radiant" size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branches/Collections container */}
      <div className="relative flex flex-col gap-4 max-w-[18em]">
        {/* Horizontal width line at top of branches */}
        <div className="w-1/2 h-px bg-black self-center" />

        {/* Render each branch as a collection */}
        {branches.map((branch, index) => {
          const { bigNfts, smallNfts, additionalCount } = splitNftsForDisplay(branch.nfts);

          // Skip empty branches
          if (branch.nfts.length === 0) return null;

          return (
            <React.Fragment key={branch.title}>
              {/* Vertical connector between collections */}
              {index > 0 && (
                <div className="w-px h-4 bg-black self-center" />
              )}

              <MurderTreeCollection
                title={branch.title}
                bigNfts={bigNfts}
                smallNfts={smallNfts}
                additionalCount={additionalCount}
                onNftClick={onNftClick}
              />
            </React.Fragment>
          );
        })}

        {/* Empty state */}
        {branches.every(b => b.nfts.length === 0) && (
          <div className="text-center py-8">
            <p className="font-mondwest text-sm text-content-muted">
              No burned NFTs yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FullMurderTree;
