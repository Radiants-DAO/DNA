'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { type Auction, type AuctionStatus, getAuctionStatus } from '../types';

// ============================================================================
// Types
// ============================================================================

interface AuctionDisplayProps {
  auction: Auction;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

// ============================================================================
// Status Badge Component
// ============================================================================

function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  const variants: Record<AuctionStatus, 'success' | 'warning' | 'info'> = {
    live: 'success',
    ended: 'warning',
    upcoming: 'info',
  };

  const labels: Record<AuctionStatus, string> = {
    live: 'LIVE',
    ended: 'ENDED',
    upcoming: 'UPCOMING',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// ============================================================================
// NFT Image Component
// ============================================================================

function NFTImage({ auction }: { auction: Auction }) {
  const hasImage = auction.metadata.image && !auction.metadata.image.includes('placeholder');

  return (
    <div className="aspect-square w-full max-w-[280px] mx-auto bg-gradient-to-br from-sun-yellow/20 to-sky-blue/20 rounded-md overflow-hidden border-2 border-black shadow-[4px_4px_0_0_var(--color-black)]">
      {hasImage ? (
        <img
          src={auction.metadata.image}
          alt={auction.metadata.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-cream">
          <div className="text-center">
            <div className="text-6xl mb-2">🌟</div>
            <p className="font-joystix text-xs text-black/40">
              {auction.metadata.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Attributes Display
// ============================================================================

function AttributesDisplay({ attributes }: { attributes: Array<{ trait_type: string; value: string | number }> }) {
  // Show max 4 attributes
  const displayAttrs = attributes.slice(0, 4);
  const remaining = attributes.length - displayAttrs.length;

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {displayAttrs.map((attr, i) => (
        <Badge key={i} variant="default" size="sm">
          {attr.value}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="default" size="sm">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AuctionDisplay({
  auction,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: AuctionDisplayProps) {
  const status = getAuctionStatus(auction);

  return (
    <div className="space-y-4">
      {/* Navigation + Status */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev}
        >
          ← Prev
        </Button>
        <AuctionStatusBadge status={status} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
        >
          Next →
        </Button>
      </div>

      {/* NFT Image */}
      <NFTImage auction={auction} />

      {/* NFT Info */}
      <div className="text-center">
        <h2 className="font-joystix text-sm text-black">
          {auction.metadata.name}
        </h2>
        <p className="font-mono text-xs text-black/60 mt-1">
          #{auction.auctionId} • {auction.version.toUpperCase()}
        </p>
      </div>

      {/* Attributes */}
      {auction.metadata.attributes.length > 0 && (
        <AttributesDisplay attributes={auction.metadata.attributes} />
      )}

      {/* Countdown Timer */}
      <CountdownTimer
        endTime={auction.account.endTimestamp}
        startTime={auction.account.startTimestamp}
        variant="default"
        label={status === 'live' ? 'Auction ends in' : status === 'upcoming' ? 'Starts in' : undefined}
        endedMessage="Auction Ended"
      />
    </div>
  );
}

export default AuctionDisplay;
