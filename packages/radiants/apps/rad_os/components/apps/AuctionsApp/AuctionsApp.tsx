'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useToast, HelpPanel, Web3ActionBar, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@dna/radiants/components/core';
import { Button } from '@/components/ui/Button';
import { AuctionsHelpContent } from './AuctionsHelpContent';
import nftsData from '@/lib/mockData/nfts.json';
import allMetadataData from '@/lib/mockData/nft-metadata/all-metadata.json';
import {
  getAuctionStatus,
  formatTimeRemaining,
  formatAddress,
  type Auction,
} from './types';
import { AppProps } from '@/lib/constants';
import { TwitterIcon } from '@/components/icons';
import { useAuctionsMockState } from '@/hooks/useAppMockState';
import { AuctionMurderTree } from './components/AuctionMurderTree';

// NFT Metadata interface from gateway
interface NFTMetadata {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  external_url?: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  collection?: {
    name: string;
    family?: string;
  };
  creators?: Array<{
    address: string;
    share: number;
  }>;
  seller_fee_basis_points?: number;
}

// ============================================================================
// Generate Auctions from Real Metadata
// ============================================================================

// Helper to generate timestamps
const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

// Generate auctions from real NFT metadata
function generateAuctionsFromMetadata(): Auction[] {
  const allMetadata = allMetadataData as Record<string, NFTMetadata>;
  const mintAddresses = Object.keys(allMetadata);
  
  // Sort by radiant number (from attributes)
  const sortedAddresses = mintAddresses.sort((a, b) => {
    const metaA = allMetadata[a];
    const metaB = allMetadata[b];
    const numA = metaA?.attributes?.find(attr => attr.trait_type === 'Number')?.value || '999';
    const numB = metaB?.attributes?.find(attr => attr.trait_type === 'Number')?.value || '999';
    return String(numA).localeCompare(String(numB));
  });
  
  // Generate historic auctions (001-027) - all ended
  const historicAuctions = sortedAddresses.map((mintAddress) => {
    const metadata = allMetadata[mintAddress];
    const radiantNumber = metadata?.attributes?.find(attr => attr.trait_type === 'Number')?.value || '000';
    const numValue = parseInt(String(radiantNumber));
    
    // Skip if it's 028 or higher
    if (numValue >= 28) return null;
    
    // Get SOL value from attributes for Total Value Burned
    const solValue = metadata?.attributes?.find(attr => attr.trait_type === 'SOL')?.value;
    const totalValueBurned = solValue ? Number(solValue) / 1e9 : 0;
    
    // Get NFTs Burned count from attributes
    const nftsBurnedAttr = metadata?.attributes?.find(attr => attr.trait_type === 'NFTs Burned');
    const nftsBurned = nftsBurnedAttr ? Number(nftsBurnedAttr.value) : 0;
    
    // Historic auctions are all ended (finished in the past)
    return {
      auctionId: `auction-${radiantNumber}`,
      version: 'v2' as const,
      metadata: {
        name: metadata?.name || `Radiant #${radiantNumber}`,
        image: metadata?.image || '/assets/radiants/radiant-001.avif',
        attributes: metadata?.attributes || [],
      },
      account: {
        startTimestamp: now - (30 - numValue) * day, // Staggered start times
        endTimestamp: now - (30 - numValue) * day + 3 * day, // Ended 3 days after start
        winner: '0xABCD...EF01',
        highestBidder: '0xABCD...EF01',
        highestBid: Math.round(totalValueBurned * 100) / 100,
        isClaimed: true,
      },
    };
  }).filter((auction) => auction !== null) as Auction[];
  
  // Generate current auction (028) - live
  const currentAuction: Auction = {
    auctionId: 'auction-028',
    version: 'v2' as const,
    metadata: {
      name: 'Radiant 028',
      image: '/assets/radiants/radiant-028-blank.png',
      attributes: [],
    },
    account: {
      startTimestamp: now - 2 * day, // Started 2 days ago
      endTimestamp: now + 1 * day + 12 * hour, // Ends in ~1.5 days
      winner: null,
      highestBidder: '0x1234...5678',
      highestBid: 171.8, // Current top offering
      isClaimed: false,
    },
  };
  
  // Return historic auctions first, then current
  return [...historicAuctions, currentAuction];
}

// Generate auctions once
const generatedAuctions = generateAuctionsFromMetadata();

// ============================================================================
// Helper Functions
// ============================================================================

// Get collection name from mint address
function getCollectionName(mintAddress: string): string {
  const collectionMap: Record<string, string> = {
    '5f2zrjBonizqt6LiHSDfbTPH74sHMZFahYQGyPNh825G': 'Bored Ape Social Club',
    'DWqohiipht459EGsin9mZ13ZpB8GkP4qCsHQFpUX7tBo': 'Bored Ape Social Experiments',
    '6sXpEuvgKmDdv11KRjc637QEjqs5X6sjerVaaEEzSUMQ': 'Bored Ape Science Club',
  };
  return collectionMap[mintAddress] || 'Unknown Collection';
}

// Map short collection names to mint addresses
function getMintAddressFromShortName(shortName: string): string | null {
  const nameToMintMap: Record<string, string> = {
    'BAPE': '5f2zrjBonizqt6LiHSDfbTPH74sHMZFahYQGyPNh825G',
    'BASE': 'DWqohiipht459EGsin9mZ13ZpB8GkP4qCsHQFpUX7tBo',
    'BASC': '6sXpEuvgKmDdv11KRjc637QEjqs5X6sjerVaaEEzSUMQ',
    'Bears Reloaded': '2SBsLb5CwstwxxDmbanRdvV9vzeACRdvYEJjpPSFjJpE',
    'Ded Monkes': 'GxPPZB5q1nsUTPw8Kkp4qUpbegrGxHiJfgzm3V43zjAy',
  };
  return nameToMintMap[shortName] || null;
}

// Format large numbers (like SOL lamports) for display
function formatValue(traitType: string, value: string | number): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  
  const num = parseFloat(value);
  
  // Handle SOL lamports (9 decimals) - e.g., 61920000000 = 61.92 SOL
  if (traitType === 'SOL' && !isNaN(num) && num > 0) {
    return (num / 1e9).toFixed(2) + ' SOL';
  }
  
  // Handle other large numbers that look like lamports (mint addresses as trait_type)
  // These are typically collection contributions in lamports
  if (!isNaN(num) && num > 1e8 && traitType.length > 40) {
    // Likely a mint address trait_type with lamport value
    return (num / 1e9).toFixed(2);
  }
  
  // Format other large numbers with commas
  if (!isNaN(num) && num > 1000) {
    return num.toLocaleString();
  }
  
  return value.toString();
}

// ============================================================================
// Styles (matching reference Webflow CSS exactly)
// Based on: /reference/Radiant Nexus Final/css/radiant-nexus.css
// ============================================================================

const styles = {
  // rad_wrap - Main flexbox layout (gap: 0.5em = gap-2)
  wrap: `
    flex flex-col w-full items-start content-start
    gap-2
    text-black font-joystix
    bg-white rounded border border-black p-2
  `,

  // rad_select-wrap - Navigation row (styled like TabList, positioned at bottom)
  selectWrap: `
    fixed bottom-0 left-0 right-0 z-10
    flex items-center justify-center gap-4 px-2 py-2
    bg-warm-cloud border-t border-black shrink-0
  `,

  // taskbar-icon - Standard button (min-w: 1.5em, h: 1.5em)
  taskbarIcon: `
    flex min-w-6 h-6 justify-center items-center
    border border-black bg-cream rounded
    cursor-pointer
    transition-none
  `,

  // taskbar-icon.hover:hover - Shadow lift effect
  taskbarIconHover: `
    hover:bg-sun-yellow
    hover:shadow-[2px_2px_0_0_var(--color-black)]
    hover:-translate-x-0.5 hover:-translate-y-0.5
    active:shadow-[1px_1px_0_0_var(--color-black)]
    active:-translate-x-px active:-translate-y-px
  `,

  // taskbar-icon.hover.inactive
  taskbarIconInactive: `
    bg-warm-cloud cursor-not-allowed opacity-50
    hover:bg-warm-cloud
    hover:shadow-none hover:translate-x-0 hover:translate-y-0
  `,

  // Dropdown button (wider)
  dropdown: `
    static
    flex h-6 flex-1 w-full px-2 items-center gap-2
    border border-black bg-cream rounded
    cursor-pointer text-xs
    hover:bg-warm-cloud
  `,

  // rad_stat - Stat box (border-radius: 0.25em, padding: 0.25em 0.5em)
  stat: `
    flex h-full px-2 py-1 justify-center items-center
    border border-black bg-cream rounded
    text-xs text-center
  `,

  // rad_offering-amount - Large stat (padding: 1em 0.25em)
  statLarge: `
    flex h-full px-2 py-4 justify-center items-center flex-col
    border border-black bg-cream rounded
    text-center
  `,

  // Image container (left column)
  imageWrap: `
    aspect-square
    border border-black bg-cream rounded
    overflow-hidden
  `,
  
  // Right column container for info
  infoColumn: `
    flex flex-col gap-2 items-stretch w-full px-4
  `,

  // Toast overlay (vault, deposit modal)
  toastOverlay: `
    absolute inset-0 z-10
    bg-black/50
    flex items-center justify-center p-4
  `,
  toastContent: `
    w-full max-w-md max-h-[80%]
    bg-cream border border-black rounded
    shadow-[4px_4px_0_0_var(--color-black)]
    overflow-auto
  `,

  // Dropdown list (rad_auction-history-dropdown-list)
  // Changed from fixed to absolute so it only covers the parent relative container
  dropdownList: `
    absolute inset-x-0 bottom-0 top-[2.5rem] z-30
    border border-black bg-white rounded
    flex flex-wrap content-start items-start
    gap-0.5
    p-2
    overflow-auto
  `,

  // Section header (text-size-small text-align-center margin-xsmall)
  sectionHeader: `
    w-full text-xs text-center py-1
    font-joystix
  `,

  // History container (rad_auction-history)
  historyContainer: `
    w-full grid grid-cols-5 gap-1
  `,

  // History item (rad_auction-history-item) - matches outline button variant
  historyItem: `
    border border-black bg-transparent
    cursor-pointer select-none
    rounded-sm
    w-full
    pt-1 px-1 pb-0 relative
    hover:bg-black/5
    active:bg-sun-yellow
  `,

  // History item selected/active (w--redirected-checked)
  historyItemActive: `
    bg-sun-yellow
  `,

  // History image (rad_history-img)
  historyImg: `
    aspect-square border border-black
    overflow-hidden
  `,

  // History number (rad_auction-history-number)
  historyNumber: `
    text-center text-xs mt-1 mb-0.5
    font-joystix text-black
  `,

  // Divider (divider margin-xsmall)
  divider: `
    w-full h-px bg-black/20 my-1
  `,
};

// ============================================================================
// SVG Icons (matching Webflow pixel art style)
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

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ============================================================================
// Navigation Component
// ============================================================================

function AuctionNavigation({
  currentAuction,
  auctions,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
  hasPrev,
  hasNext,
}: {
  currentAuction: Auction;
  auctions: Auction[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { ownedRadiants, isConnected } = useAuctionsMockState();

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
          id="auction-dropdown-toggle"
          type="button"
          className="flex items-center justify-center gap-2 px-4 h-8 font-joystix text-xs uppercase cursor-pointer select-none text-black transition-all duration-200 ease-out relative border border-black rounded-sm bg-transparent hover:bg-black/5 hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none flex-1 w-full"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="flex-1 truncate text-left">{currentAuction.metadata.name}</span>
          <div className="flex-1 h-px bg-black/20 mx-2" />
          <ChevronDownIcon />
        </button>

        {/* Dropdown List */}
        {dropdownOpen && (
          <nav className={`${styles.dropdownList} w-dropdown-list w--open`} aria-labelledby="auction-dropdown-toggle">
            {/* Your Radiants Section - Only show if connected and owns radiants */}
            {isConnected && ownedRadiants.length > 0 && (
              <>
                <div className={styles.sectionHeader}>Your Radiants</div>
                <div className={styles.historyContainer}>
                  {ownedRadiants.map((radiant) => {
                    const radiantNumber = radiant.radiantNumber.padStart(3, '0');
                    // Find if this radiant matches any auction
                    const matchingIndex = auctions.findIndex(
                      (a) => a.auctionId === `auction-${radiant.radiantNumber}` ||
                             a.auctionId === `auction-${radiantNumber}`
                    );
                    const isActive = matchingIndex === currentIndex;

                    return (
                      <button
                        key={radiant.mintAddress}
                        className={`${styles.historyItem} ${isActive ? styles.historyItemActive : ''}`}
                        onClick={() => {
                          if (matchingIndex >= 0) {
                            onSelect(matchingIndex);
                            setDropdownOpen(false);
                          }
                        }}
                        disabled={matchingIndex < 0}
                      >
                        <div className={styles.historyImg}>
                          {radiant.image ? (
                            <img
                              src={radiant.image}
                              alt={radiant.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-sun-yellow/20 to-cream flex items-center justify-center">
                              <span className="text-lg">🌟</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.historyNumber}>
                          {radiantNumber}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className={styles.divider}></div>
              </>
            )}

            {/* All Radiants Section */}
            <div className={styles.sectionHeader}>All Radiants</div>
            <div className={styles.historyContainer}>
              {auctions.map((auction, index) => {
                const radiantNumber = auction.auctionId.replace('auction-', '').padStart(3, '0');
                const isActive = index === currentIndex;
                
                return (
                  <button
                    key={auction.auctionId}
                    className={`${styles.historyItem} ${isActive ? styles.historyItemActive : ''}`}
                    onClick={() => {
                      onSelect(index);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className={styles.historyImg}>
                      {auction.metadata.image && !auction.metadata.image.includes('placeholder') ? (
                        <img
                          src={auction.metadata.image}
                          alt={auction.metadata.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sun-yellow/20 to-cream flex items-center justify-center">
                          <span className="text-lg">🌟</span>
                        </div>
                      )}
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
// Stats Row Component
// ============================================================================

function StatsRow({
  auction,
  status,
  timeRemaining,
}: {
  auction: Auction;
  status: 'live' | 'ended' | 'upcoming';
  timeRemaining: string;
}) {
  // Check if this is a historic auction (has metadata with SOL attribute)
  const isHistoric = status === 'ended' && auction.metadata.attributes && auction.metadata.attributes.length > 0;
  
  // Get Total Value Burned from SOL attribute for historic auctions
  const solAttr = isHistoric ? auction.metadata.attributes.find(attr => attr.trait_type === 'SOL') : null;
  const totalValueBurned = solAttr ? Number(solAttr.value) / 1e9 : 0;
  
  // Get USD value from attributes for historic auctions
  const usdAttr = isHistoric ? auction.metadata.attributes.find(attr => attr.trait_type === 'USD') : null;
  const totalValueBurnedUSD = usdAttr ? Number(usdAttr.value) : 0;
  
  // Get NFTs Sacrificed count from attributes
  const nftsBurnedAttr = isHistoric ? auction.metadata.attributes.find(attr => attr.trait_type === 'NFTs Burned') : null;
  const nftsSacrificed = nftsBurnedAttr ? Number(nftsBurnedAttr.value) : 0;
  
  // Toggle between SOL and USD every 2 seconds for historic auctions
  const [showUSD, setShowUSD] = useState(false);
  
  useEffect(() => {
    if (!isHistoric) return;
    
    const interval = setInterval(() => {
      setShowUSD((prev) => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isHistoric]);
  
  return (
    <div className="space-y-4">
      {/* Collection Contributions Style Stats */}
      {isHistoric ? (
        <div className="border-t border-black/20 pt-2 w-full">
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-2 w-full text-xs">
              <span className="font-mono text-black/60 uppercase">total value burned</span>
              <div className="flex-1 h-px bg-black/20" />
              <span className="font-mondwest text-black/60">
                {showUSD 
                  ? (totalValueBurnedUSD > 0 ? `$${totalValueBurnedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-')
                  : (totalValueBurned > 0 ? `${totalValueBurned.toFixed(2)} SOL` : '-')
                }
              </span>
            </div>
            <div className="flex items-center gap-2 w-full text-xs">
              <span className="font-mono text-black/60 uppercase">total nfts sacrificed</span>
              <div className="flex-1 h-px bg-black/20" />
              <span className="font-mondwest text-black/60">
                {nftsSacrificed.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Status Labels */}
          <div className={styles.stat}>
            {status === 'live' ? 'top offering' : status === 'ended' ? 'final offering' : 'starts in'}
          </div>
          <div className={styles.stat}>
            {status === 'live' ? 'time until sacrifice' : status === 'ended' ? 'winner' : 'time until start'}
          </div>

          {/* Large Stats */}
          <div className={styles.statLarge}>
            <>
              <span className="text-xs text-black/60 font-mondwest mb-1">
                {auction.account.highestBid > 0 ? 'SOL' : '-'}
              </span>
              <span className="text-lg font-joystix">
                {auction.account.highestBid > 0 ? `${auction.account.highestBid.toFixed(1)}*` : '-'}
              </span>
            </>
          </div>
          <div className={styles.statLarge}>
            {status === 'ended' && auction.account.winner ? (
              <>
                <span className="text-xs text-black/60 font-mondwest mb-1">winner</span>
                <span className="text-sm font-mono">{formatAddress(auction.account.winner)}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-black/60 font-mondwest mb-1">remaining</span>
                <span className="text-lg font-joystix">{timeRemaining}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NFT Image Component
// ============================================================================

function NFTImage({ 
  auction,
  onInfoClick,
  isInfoOpen,
  onInfoClose,
}: { 
  auction: Auction;
  onInfoClick: () => void;
  isInfoOpen?: boolean;
  onInfoClose?: () => void;
}) {
  return (
    <div className={styles.imageWrap}>
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-sun-yellow/10 to-cream">
        {auction.metadata.image && !auction.metadata.image.includes('placeholder') ? (
          <img
            src={auction.metadata.image}
            alt={auction.metadata.name}
            className="w-full h-full object-cover max-w-[20rem]"
          />
        ) : (
          <div className="text-center p-4">
            <div className="w-24 h-24 mx-auto mb-4 rounded bg-sun-yellow/30 flex items-center justify-center">
              <span className="text-4xl">☀️</span>
            </div>
            <p className="font-joystix text-xs text-black/40">
              {auction.metadata.name}
            </p>
          </div>
        )}
        {/* Info Button Overlay */}
        <button
          type="button"
          onClick={onInfoClick}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center border border-black bg-cream rounded-sm hover:bg-sun-yellow transition-colors z-20"
          title="NFT Info"
        >
          <span className="text-xs">i</span>
        </button>
        {/* NFT Info Panel - overlays image area only */}
        {isInfoOpen && onInfoClose && (
          <NFTInfoPanel
            auction={auction}
            onClose={onInfoClose}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NFT Info Panel Component
// ============================================================================

function NFTInfoPanel({
  auction,
  onClose,
}: {
  auction: Auction;
  onClose: () => void;
}) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get metadata from local file based on auction ID
  // Maps auction ID to mint address, then looks up metadata
  const getMetadata = useCallback((auctionId: string): NFTMetadata | null => {
    const allMetadata = allMetadataData as Record<string, NFTMetadata>;
    const nfts = nftsData as Record<string, string>;
    const mintAddresses = Object.keys(nfts);
    
    // Use a deterministic selection based on auction ID
    // In production, this would use a proper auction ID -> mint address mapping
    const index = parseInt(auctionId.replace('auction-', '')) % mintAddresses.length;
    const mintAddress = mintAddresses[index];
    
    return allMetadata[mintAddress] || null;
  }, []);

  // Get mint address from auction ID
  const getMintAddress = useCallback((auctionId: string): string | null => {
    const nfts = nftsData as Record<string, string>;
    const mintAddresses = Object.keys(nfts);
    const index = parseInt(auctionId.replace('auction-', '')) % mintAddresses.length;
    return mintAddresses[index] || null;
  }, []);


  useEffect(() => {
    // Load metadata synchronously from local file
    setLoading(true);
    setError(null);
    
    try {
      const data = getMetadata(auction.auctionId);
      if (data) {
        setMetadata(data);
      } else {
        setError('Metadata not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  }, [auction.auctionId, getMetadata]);


  return (
    <div 
      className="absolute inset-0 z-30 bg-cream rounded overflow-auto shadow-[2px_2px_0_0_var(--color-black)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-black sticky top-0 bg-cream z-10">
        <span className="font-joystix text-xs text-black uppercase">
          {metadata ? `${metadata.name} info` : 'NFT Info'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center border border-black bg-cream rounded-sm hover:bg-sun-yellow transition-colors"
          title="Close"
        >
          <span className="text-xs">×</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="font-mondwest text-sm text-black/60">Loading metadata...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="font-mondwest text-sm text-black/60">{error}</div>
            <div className="font-mono text-xs text-black/40 mt-2">
              #{auction.auctionId.replace('auction-', '')} • {auction.version.toUpperCase()}
            </div>
          </div>
        ) : metadata ? (
          <>
            {/* Art by KEMOS4BE */}
            <div>
              <a
                href="https://x.com/kemos4be"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mondwest text-black/80 hover:text-black transition-colors"
              >
                <TwitterIcon size={14} className="text-black/80" />
                Art by KEMOS4BE
              </a>
            </div>

            {/* NFT Info */}
            {metadata.collection && (
              <div className="border-t border-black/20 pt-2">
                <p className="font-mondwest text-xs text-black/60">
                  {metadata.collection.name}
                  {metadata.collection.family && ` • ${metadata.collection.family}`}
                </p>
              </div>
            )}

            {/* Description */}
            {metadata.description && (
              <div className="border-t border-black/20 pt-2">
                <p className="font-mondwest text-xs text-black/80">
                  {metadata.description}
                </p>
              </div>
            )}

            {/* Creators */}
            {metadata.creators && metadata.creators.length > 0 && (
              <div className="border-t border-black/20 pt-2">
                <h4 className="font-joystix text-xs text-black/60 uppercase mb-2">Creators</h4>
                <div className="space-y-1">
                  {metadata.creators.map((creator, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-black/80 truncate">
                        {creator.address.slice(0, 8)}...{creator.address.slice(-6)}
                      </span>
                      {creator.share > 0 && (
                        <span className="font-mondwest text-black/60">
                          {creator.share}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses */}
            {(() => {
              const mintAddress = getMintAddress(auction.auctionId);
              const ownerAddress = auction.account.winner || auction.account.highestBidder;
              
              return (mintAddress || ownerAddress) ? (
                <div className="border-t border-black/20 pt-2">
                  <h4 className="font-joystix text-xs text-black/60 uppercase mb-2">Addresses</h4>
                  <div className="space-y-1">
                    {mintAddress && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-black/60 uppercase">Mint</span>
                        <span className="font-mono text-black/80 truncate">
                          {mintAddress.slice(0, 8)}...{mintAddress.slice(-6)}
                        </span>
                      </div>
                    )}
                    {ownerAddress && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-black/60 uppercase">Owner</span>
                        <span className="font-mono text-black/80 truncate">
                          {ownerAddress.slice(0, 8)}...{ownerAddress.slice(-6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// Bidder Info Component
// ============================================================================

function BidderInfo({
  auction,
  isConnected,
  walletAddress,
}: {
  auction: Auction;
  isConnected: boolean;
  walletAddress: string | null;
}) {
  const isHighestBidder = isConnected &&
    auction.account.highestBidder &&
    auction.account.highestBidder === walletAddress;

  if (!auction.account.highestBidder) return null;

  return (
    <div className={`${styles.stat} ${isHighestBidder ? 'bg-sun-yellow' : ''}`}>
      {isHighestBidder ? (
        <span className="animate-pulse">you are the top offering!!!</span>
      ) : (
        <span>Leader: {formatAddress(auction.account.highestBidder)}</span>
      )}
    </div>
  );
}

// ============================================================================
// Vault Toast Component
// ============================================================================

function VaultToast({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div className={styles.toastOverlay} onClick={onClose}>
      <div className={styles.toastContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-black">
          <span className="font-joystix text-xs">Your Vault</span>
          <button
            className={`${styles.taskbarIcon} w-6 h-6`}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded border border-black bg-warm-cloud flex items-center justify-center">
              <span className="text-2xl">📭</span>
            </div>
            <p className="font-mondwest text-sm text-black/60">
              Vault is empty
            </p>
            <p className="font-mono text-2xs text-black/40 mt-1">
              Deposit NFTs to use as bid collateral
            </p>
          </div>
          <button
            className={`${styles.taskbarIcon} ${styles.taskbarIconHover} w-full px-4 py-2 text-xs`}
          >
            + Deposit NFTs
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AuctionsApp({ windowId }: AppProps) {
  const { addToast } = useToast();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVaultVisible, setVaultVisible] = useState(false);
  const [isTreeVisible, setTreeVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Current auction
  const currentAuction = generatedAuctions[currentIndex];
  const status = getAuctionStatus(currentAuction);

  // Update countdown timer
  useEffect(() => {
    const updateTime = () => {
      if (status === 'live') {
        setTimeRemaining(formatTimeRemaining(currentAuction.account.endTimestamp));
      } else if (status === 'upcoming') {
        setTimeRemaining(formatTimeRemaining(currentAuction.account.startTimestamp));
      } else {
        setTimeRemaining('Ended');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentAuction, status]);

  // Handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(generatedAuctions.length - 1, prev + 1));
  }, []);

  const handleSelect = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setWalletAddress('0x1234...5678');
    addToast({
      title: 'Wallet Connected',
      description: 'Successfully connected',
      variant: 'success',
    });
  }, [addToast]);

  const handleShowVault = useCallback(() => {
    setVaultVisible(true);
  }, []);

  const handleShowTree = useCallback(() => {
    setTreeVisible(true);
  }, []);

  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isNftInfoOpen, setNftInfoOpen] = useState(false);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    addToast({
      title: 'Wallet Disconnected',
      description: 'Successfully disconnected',
      variant: 'success',
    });
  }, [addToast]);

  return (
    <div className="relative h-full overflow-hidden bg-warm-cloud p-2 flex flex-col">
      {/* Main content */}
      <div className={`${styles.wrap} flex-1 min-h-0 overflow-auto`}>
        {/* Left Column - relative container for dropdown overlay */}
        <div className="relative flex flex-col gap-2">
          <AuctionNavigation
            currentAuction={currentAuction}
            auctions={generatedAuctions}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelect={handleSelect}
            hasPrev={currentIndex > 0}
            hasNext={currentIndex < generatedAuctions.length - 1}
          />
          <NFTImage 
            auction={currentAuction}
            onInfoClick={() => setNftInfoOpen(true)}
            isInfoOpen={isNftInfoOpen}
            onInfoClose={() => setNftInfoOpen(false)}
          />
        </div>

        {/* Right Column: Info or Murder Tree */}
        <div className="relative flex flex-col gap-2 h-full">
          {/* Show Murder Tree inline when visible */}
          {isTreeVisible && status === 'ended' ? (
            <div className="space-y-4 w-full px-4 h-full flex flex-col">
              {/* Back button */}
              <button
                onClick={() => setTreeVisible(false)}
                className="flex items-center gap-2 font-joystix text-xs text-black/60 hover:text-black transition-colors"
              >
                <span>←</span>
                <span>Back to Info</span>
              </button>

              {/* Murder Tree with connecting line from radiant image */}
              <div className="relative">
                {/* Horizontal connecting line from left (radiant image side) */}
                <div className="absolute top-4 left-0 w-6 h-px bg-black -translate-x-full" />

                {/* Murder Tree */}
                <AuctionMurderTree
                  auction={currentAuction}
                  hideRadiantImage
                  className="border-l border-black"
                />
              </div>
            </div>
          ) : (
            <div className="w-full px-4 h-full flex flex-col">
              {/* Radiant Name Heading */}
              <h1 className="font-mondwest font-normal text-5xl text-black">
                {currentAuction.metadata.name}
              </h1>

              {/* Stats */}
              <StatsRow
                auction={currentAuction}
                status={status}
                timeRemaining={timeRemaining}
              />

              {/* Historic: Attributes | Current: Bidder Info */}
              {status === 'ended' && currentAuction.metadata.attributes && currentAuction.metadata.attributes.length > 0 ? (
                /* Historic Auction - Show Attributes */
                <div className="space-y-4">
                  {/* Collection Contributions */}
                  {(() => {
                    // Excluded attribute types (shown elsewhere or not collection data)
                    const excludedTypes = ['SOL', 'USD', 'Number', 'NFTs Burned'];

                    // Build list of all collection contributions
                    // A collection contribution is an attribute with:
                    // - A readable name (not a long mint address)
                    // - A numeric count value > 0 and <= 100000 (reasonable NFT count)
                    const contributions = currentAuction.metadata.attributes
                      .filter(attr => {
                        // Skip excluded types
                        if (excludedTypes.includes(attr.trait_type)) return false;
                        // Skip mint addresses (long strings > 40 chars)
                        if (attr.trait_type.length > 40) return false;
                        // Must have a numeric count value
                        const count = typeof attr.value === 'number'
                          ? attr.value
                          : parseFloat(String(attr.value));
                        // Count must be > 0 and reasonable (not lamports)
                        return !isNaN(count) && count > 0 && count <= 100000;
                  })
                  .map(attr => {
                    const count = typeof attr.value === 'number' 
                      ? attr.value 
                      : parseFloat(String(attr.value));
                    
                    // Try to find matching mint address for SOL amount
                    const mintAddr = getMintAddressFromShortName(attr.trait_type);
                    let solAmount = '0.00';
                    
                    if (mintAddr) {
                      // Found via short name mapping
                      const mintAttr = currentAuction.metadata.attributes.find(a => a.trait_type === mintAddr);
                      if (mintAttr) {
                        solAmount = (parseFloat(String(mintAttr.value)) / 1e9).toFixed(2);
                      }
                    }
                    
                    return {
                      name: attr.trait_type,
                      count,
                      solAmount,
                    };
                  });
                
                return contributions.length > 0 ? (
                  <div className="border-t border-black/20 pt-2 w-full">
                    <h4 className="font-joystix text-xs text-black/60 uppercase mb-2">Collection Contributions</h4>
                    <div className="space-y-1 w-full">
                      {contributions.map((contrib, index) => (
                        <div key={index} className="flex items-center gap-2 w-full text-xs">
                          <span className="font-mono text-black/80 uppercase">
                            {contrib.name}
                          </span>
                          <div className="flex-1 h-px bg-black/20" />
                          <span className="font-mondwest text-black/60">
                            {contrib.count}{contrib.solAmount !== '0.00' ? ` • ${contrib.solAmount} SOL` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

                  {/* Murder Tree Button */}
                  <Button
                    variant="outline"
                    onClick={handleShowTree}
                    className="w-full mt-4"
                  >
                    View Murder Tree
                  </Button>
                </div>
              ) : (
                /* Current Auction - Show Bidder Info */
                <BidderInfo
                  auction={currentAuction}
                  isConnected={isConnected}
                  walletAddress={walletAddress}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Web3 Action Bar */}
      <Web3ActionBar
        isConnected={isConnected}
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      >
        {/* Auction-specific actions */}
        <Button variant="outline" onClick={handleShowVault}>
          My Vault
        </Button>
        {status === 'live' && (
          <Button onClick={() => {}}>
            Place Offering
          </Button>
        )}
      </Web3ActionBar>

      {/* Help Panel */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setHelpOpen(false)}
        title="Auction Info"
      >
        <AuctionsHelpContent />
      </HelpPanel>

      {/* Vault Toast */}
      <VaultToast
        isVisible={isVaultVisible}
        onClose={() => setVaultVisible(false)}
      />
    </div>
  );
}

export default AuctionsApp;
