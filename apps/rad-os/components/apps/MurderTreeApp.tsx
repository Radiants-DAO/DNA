'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Badge,
  Dialog,
  Button,
} from '@rdna/radiants/components/core';
import { FullMurderTree, type MurderTreeNFT } from '@/components/murderTree';
import {
  getAllRadiantsWithMurderTree,
  getMurderTreeByNumber,
  getBurnedCollectionsSummary,
} from '@/lib/mockData/murderTreeData';
import { AppProps } from '@/lib/constants';

// ============================================================================
// Styles (matching AuctionsApp pattern)
// ============================================================================

const styles = {
  // rad_wrap - Main 2-column grid
  wrap: `
    grid w-full items-center content-start
    grid-cols-2 gap-2
    text-content-primary font-joystix
    bg-surface-elevated rounded border border-edge-primary p-4
  `,

  // Image container (left column)
  imageWrap: `
    aspect-square
    border border-edge-primary bg-surface-primary rounded
    overflow-hidden
  `,
  
  // Right column container for info
  infoColumn: `
    flex flex-col gap-2 items-stretch w-full px-4
  `,

  // Dropdown list
  dropdownList: `
    absolute inset-x-0 bottom-0 top-[2.5rem] z-30
    border border-edge-primary bg-surface-elevated rounded
    flex flex-wrap content-start items-start
    gap-0.5
    p-2
    overflow-auto
  `,

  // Section header
  sectionHeader: `
    w-full text-xs text-center py-1
    font-joystix
  `,

  // History container
  historyContainer: `
    w-full grid grid-cols-5 gap-1
  `,

  // History item
  historyItem: `
    border border-edge-primary bg-transparent
    cursor-pointer select-none
    rounded-sm
    w-full
    pt-1 px-1 pb-0 relative
    hover:bg-surface-muted
    active:bg-sun-yellow
  `,

  // History item selected/active
  historyItemActive: `
    bg-sun-yellow
  `,

  // History image
  historyImg: `
    aspect-square border border-edge-primary
    overflow-hidden
  `,

  // History number
  historyNumber: `
    text-center text-xs mt-1 mb-0.5
    font-joystix text-content-primary
  `,
};

// ============================================================================
// SVG Icons
// ============================================================================

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g>
        <path d="M13,2h-4v2h2v1h1v2h2V2h-1Z" fill="currentColor"/>
      </g>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g>
        <path d="M4,10v-1h-2v5h5v-2h-2v-1h-1v-1Z" fill="currentColor"/>
      </g>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
      <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================================
// Navigation Component
// ============================================================================

interface RadiantInfo {
  number: string;
  name: string;
  totalBurned: number;
  mintAddress: string;
}

function RadiantNavigation({
  currentRadiant,
  allRadiants,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
  hasPrev,
  hasNext,
}: {
  currentRadiant: RadiantInfo;
  allRadiants: RadiantInfo[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex gap-2 items-center overflow-x-auto">
      {/* Prev Arrow */}
      <Button
        iconOnly
        onClick={onPrev}
        disabled={!hasPrev}
        variant="outline"
        className="flex items-center justify-center"
      >
        <ArrowLeftIcon />
      </Button>

      {/* Dropdown */}
      <div className="static flex-1">
        <button
          id="radiant-dropdown-toggle"
          type="button"
          className="flex items-center justify-center gap-2 px-4 h-8 font-joystix text-xs uppercase cursor-pointer select-none text-content-primary transition-all duration-200 ease-out relative border border-edge-primary rounded-sm bg-transparent hover:bg-surface-muted hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none flex-1 w-full"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="flex-1 truncate text-left">{currentRadiant.name}</span>
          <div className="flex-1 h-px bg-edge-muted mx-2" />
          <ChevronDownIcon />
        </button>

        {/* Dropdown List */}
        {dropdownOpen && (
          <nav className={`${styles.dropdownList} w-dropdown-list w--open`} aria-labelledby="radiant-dropdown-toggle">
            {/* All Radiants Section */}
            <div className={styles.sectionHeader}>All Radiants</div>
            <div className={styles.historyContainer}>
              {allRadiants.map((radiant, index) => {
                const radiantNumber = radiant.number.padStart(3, '0');
                const isActive = index === currentIndex;
                
                return (
                  <button
                    key={radiant.mintAddress}
                    className={`${styles.historyItem} ${isActive ? styles.historyItemActive : ''}`}
                    onClick={() => {
                      onSelect(index);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className={styles.historyImg}>
                      <div className="w-full h-full bg-gradient-to-br from-sun-yellow/20 to-cream flex items-center justify-center">
                        <span className="text-lg">🌟</span>
                      </div>
                    </div>
                    <div className={styles.historyNumber}>
                      {radiantNumber}
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* Next Arrow */}
      <Button
        iconOnly
        onClick={onNext}
        disabled={!hasNext}
        variant="outline"
        className="flex items-center justify-center"
      >
        <ArrowRightIcon />
      </Button>
    </div>
  );
}

// ============================================================================
// NFT Image Component
// ============================================================================

function RadiantImage({ 
  radiantName,
  radiantImage,
  onInfoClick,
}: { 
  radiantName: string;
  radiantImage?: string;
  onInfoClick?: () => void;
}) {
  return (
    <div className={styles.imageWrap}>
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-sun-yellow/10 to-cream">
        {radiantImage ? (
          <img
            src={radiantImage}
            alt={radiantName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-4">
            <div className="w-24 h-24 mx-auto mb-4 rounded bg-sun-yellow/30 flex items-center justify-center">
              <span className="text-4xl">☀️</span>
            </div>
            <p className="font-joystix text-xs text-content-muted">
              {radiantName}
            </p>
          </div>
        )}
        {/* Info Button Overlay */}
        {onInfoClick && (
          <button
            type="button"
            onClick={onInfoClick}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center border border-edge-primary bg-surface-primary rounded-sm hover:bg-sun-yellow transition-colors z-20"
            title="NFT Info"
          >
            <span className="text-xs">i</span>
          </button>
        )}
      </div>
    </div>
  );
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
  const dialog = Dialog.useDialogState({ open: isOpen, onOpenChange: (open) => !open && onClose() });

  if (!nft) return null;

  return (
    <Dialog.Provider {...dialog}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{nft.name}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            {/* NFT Image */}
            {nft.image && (
              <div className="aspect-square w-full max-w-[200px] mx-auto border border-edge-primary overflow-hidden">
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
                <span className="font-mondwest text-xs text-content-muted">Collection</span>
                <span className="font-mondwest text-xs text-content-primary">{nft.collection}</span>
              </div>
              {nft.value && (
                <div className="flex justify-between">
                  <span className="font-mondwest text-xs text-content-muted">Value at Burn</span>
                  <Badge variant="warning" size="sm">{nft.value.toFixed(2)} SOL</Badge>
                </div>
              )}
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="primary">Close</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Provider>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MurderTreeApp({ windowId }: AppProps) {
  // Get all radiants with murder tree data
  const allRadiants = useMemo(() => getAllRadiantsWithMurderTree(), []);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNft, setSelectedNft] = useState<MurderTreeNFT | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Current radiant
  const currentRadiant = allRadiants[currentIndex];

  // Get murder tree data for selected radiant
  const murderTreeData = useMemo(() => {
    if (!currentRadiant?.number) return null;
    return getMurderTreeByNumber(currentRadiant.number);
  }, [currentRadiant?.number]);

  // Get collection summary
  const collectionSummary = useMemo(() => {
    if (!murderTreeData?.mintAddress) return [];
    return getBurnedCollectionsSummary(murderTreeData.mintAddress);
  }, [murderTreeData?.mintAddress]);

  // Handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(allRadiants.length - 1, prev + 1));
  }, [allRadiants.length]);

  const handleSelect = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleNftClick = useCallback((nft: MurderTreeNFT) => {
    setSelectedNft(nft);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  if (allRadiants.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="font-mondwest text-content-muted">No Radiants available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-surface-primary p-2 flex flex-col">
      {/* Main content */}
      <div className={`${styles.wrap} flex-1 min-h-0 overflow-auto`}>
        {/* Left Column - relative container for dropdown overlay */}
        <div className="relative flex flex-col gap-2">
          <RadiantNavigation
            currentRadiant={currentRadiant}
            allRadiants={allRadiants}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelect={handleSelect}
            hasPrev={currentIndex > 0}
            hasNext={currentIndex < allRadiants.length - 1}
          />
          <RadiantImage 
            radiantName={murderTreeData?.radiantName || currentRadiant.name}
            radiantImage={murderTreeData?.radiantImage}
          />
        </div>

        {/* Right Column: Info */}
        <div className={styles.infoColumn}>
          {/* Radiant Name Heading */}
          <h2 className="font-mondwest text-3xl text-content-primary">
            {currentRadiant.name}
          </h2>
          
          {/* Stats Summary */}
          <div className="space-y-4">
            <div className="border-t border-edge-muted pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-start gap-8 text-xs">
                  <span className="font-mono text-content-muted uppercase">total nfts burned</span>
                  <div className="flex-1 h-px bg-edge-muted" />
                  <span className="font-mondwest text-content-muted">
                    {currentRadiant.totalBurned.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Collection Contributions */}
            {collectionSummary.length > 0 && (
              <div className="border-t border-edge-muted pt-2 w-full">
                <h4 className="font-joystix text-xs text-content-muted uppercase mb-2">Collections Burned</h4>
                <div className="space-y-1 w-full">
                  {collectionSummary.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 w-full text-xs">
                      <span className="font-mono text-content-secondary uppercase">
                        {item.collection}
                      </span>
                      <div className="flex-1 h-px bg-edge-muted" />
                      <span className="font-mondwest text-content-muted">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Murder Tree Visualization */}
          {murderTreeData && (
            <div className="border-t border-edge-muted pt-2 mt-2">
              <FullMurderTree
                radiantImage={murderTreeData.radiantImage}
                radiantName={murderTreeData.radiantName}
                branches={murderTreeData.branches}
                onNftClick={handleNftClick}
              />
            </div>
          )}
        </div>
      </div>

      {/* NFT Detail Dialog */}
      <NFTDetailDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        nft={selectedNft}
      />
    </div>
  );
}

export default MurderTreeApp;
