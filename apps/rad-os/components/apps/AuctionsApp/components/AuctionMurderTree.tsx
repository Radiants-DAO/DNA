'use client';

import React, { useState, useMemo } from 'react';
import { FullMurderTree, type MurderTreeNFT } from '@/components/murderTree';
import { getMurderTreeByNumber, getBurnedCollectionsSummary } from '@/lib/mockData/murderTreeData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose,
  Badge,
} from '@rdna/radiants/components/core';
import { Button } from '@/components/ui/Button';
import { type Auction } from '../types';

// ============================================================================
// Types
// ============================================================================

interface AuctionMurderTreeProps {
  /** The auction to display murder tree for */
  auction: Auction;
  /** Hide the radiant image (for inline display) */
  hideRadiantImage?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// NFT Detail Dialog
// ============================================================================

interface NFTDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nft: MurderTreeNFT | null;
}

function NFTDetailDialog({ isOpen, onClose, nft }: NFTDetailDialogProps) {
  if (!nft) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{nft.name}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            {/* NFT Image */}
            {nft.image && (
              <div className="aspect-square w-full max-w-[200px] mx-auto border border-black overflow-hidden">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* NFT Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-mondwest text-xs text-black/60">Collection</span>
                <span className="font-mondwest text-xs text-black">{nft.collection}</span>
              </div>
              {nft.value && (
                <div className="flex justify-between">
                  <span className="font-mondwest text-xs text-black/60">Value at Burn</span>
                  <Badge variant="warning" size="sm">{nft.value.toFixed(2)} SOL</Badge>
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AuctionMurderTree - Shows the murder tree for a historical auction
 *
 * Extracts the radiant number from the auction and displays
 * the tree of burned NFTs that were sacrificed to win it.
 */
export function AuctionMurderTree({ auction, hideRadiantImage = false, className = '' }: AuctionMurderTreeProps) {
  const [selectedNft, setSelectedNft] = useState<MurderTreeNFT | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extract radiant number from auction (e.g., "auction-016" -> "016")
  const radiantNumber = useMemo(() => {
    const match = auction.auctionId.match(/auction-(\d+)/);
    return match ? match[1].padStart(3, '0') : null;
  }, [auction.auctionId]);

  // Get murder tree data
  const murderTreeData = useMemo(() => {
    if (!radiantNumber) return null;
    return getMurderTreeByNumber(radiantNumber);
  }, [radiantNumber]);

  // Get collection summary
  const collectionSummary = useMemo(() => {
    if (!murderTreeData?.mintAddress) return [];
    return getBurnedCollectionsSummary(murderTreeData.mintAddress);
  }, [murderTreeData?.mintAddress]);

  const handleNftClick = (nft: MurderTreeNFT) => {
    setSelectedNft(nft);
    setIsDialogOpen(true);
  };

  // No data available
  if (!murderTreeData || murderTreeData.branches.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="font-mondwest text-sm text-black/50">
          No burn data available for this auction
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Collection Summary */}
      {collectionSummary.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center px-4">
          {collectionSummary.slice(0, 5).map((item) => (
            <Badge key={item.collection} variant="default" size="sm">
              {item.collection}: {item.count}
            </Badge>
          ))}
          {collectionSummary.length > 5 && (
            <Badge variant="default" size="sm">
              +{collectionSummary.length - 5} more
            </Badge>
          )}
        </div>
      )}

      {/* Murder Tree Visualization */}
      <FullMurderTree
        radiantImage={auction.metadata.image}
        radiantName={auction.metadata.name}
        branches={murderTreeData.branches}
        onNftClick={handleNftClick}
        hideRadiantImage={hideRadiantImage}
      />

      {/* NFT Detail Dialog */}
      <NFTDetailDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        nft={selectedNft}
      />
    </div>
  );
}

export default AuctionMurderTree;
