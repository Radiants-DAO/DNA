'use client';

import React, { useState } from 'react';
import { Button, Card, CardBody, Input, Badge } from '@rdna/radiants/components/core';
import { type Auction, type AuctionStatus, getAuctionStatus, formatAddress } from '../types';

// ============================================================================
// Types
// ============================================================================

interface BidPanelProps {
  auction: Auction;
  isConnected: boolean;
  onConnect: () => void;
  onPlaceBid: (amount: number) => void;
  onClaim: () => void;
}

// ============================================================================
// Current Bid Display
// ============================================================================

function CurrentBidDisplay({ auction, status }: { auction: Auction; status: AuctionStatus }) {
  const { highestBid, highestBidder, winner } = auction.account;

  return (
    <Card variant="raised">
      <CardBody className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-2xs text-content-muted uppercase">
              {status === 'ended' ? 'Winning Bid' : 'Current Bid'}
            </p>
            <p className="font-joystix text-2xl text-black mt-1">
              {highestBid > 0 ? (
                <>
                  {highestBid} <span className="text-sm opacity-60">SOL</span>
                </>
              ) : (
                <span className="text-base opacity-60">No bids yet</span>
              )}
            </p>
          </div>
          {(highestBidder || winner) && (
            <div className="text-right">
              <p className="font-mono text-2xs text-content-muted uppercase">
                {status === 'ended' ? 'Winner' : 'Leader'}
              </p>
              <p className="font-mono text-xs text-black mt-1">
                {formatAddress(winner || highestBidder || '')}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Bid Input Form
// ============================================================================

function BidForm({
  minBid,
  onSubmit,
  disabled,
}: {
  minBid: number;
  onSubmit: (amount: number) => void;
  disabled: boolean;
}) {
  const [bidAmount, setBidAmount] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    if (amount >= minBid) {
      onSubmit(amount);
      setBidAmount('');
    }
  };

  const suggestedBid = minBid > 0 ? (minBid * 1.1).toFixed(2) : '1.0';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="number"
          step="0.01"
          min={minBid}
          placeholder={`Min: ${minBid} SOL`}
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || !bidAmount || parseFloat(bidAmount) < minBid}
        >
          Bid
        </Button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBidAmount(suggestedBid)}
          disabled={disabled}
          className="font-mono text-xs text-content-muted hover:text-content-primary disabled:opacity-50"
        >
          +10% ({suggestedBid} SOL)
        </button>
        <button
          type="button"
          onClick={() => setBidAmount((minBid * 1.25).toFixed(2))}
          disabled={disabled}
          className="font-mono text-xs text-content-muted hover:text-content-primary disabled:opacity-50"
        >
          +25%
        </button>
        <button
          type="button"
          onClick={() => setBidAmount((minBid * 1.5).toFixed(2))}
          disabled={disabled}
          className="font-mono text-xs text-content-muted hover:text-content-primary disabled:opacity-50"
        >
          +50%
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Winner Panel
// ============================================================================

function WinnerPanel({
  auction,
  onClaim,
  isConnected,
}: {
  auction: Auction;
  onClaim: () => void;
  isConnected: boolean;
}) {
  const { winner, isClaimed } = auction.account;

  if (!winner) return null;

  return (
    <Card className="bg-sun-yellow/20 border-sun-yellow">
      <CardBody className="p-4 text-center">
        <p className="font-joystix text-xs text-content-muted mb-2">
          🎉 Winner
        </p>
        <p className="font-mono text-sm text-black mb-3">
          {formatAddress(winner)}
        </p>
        {isClaimed ? (
          <Badge variant="success">Claimed</Badge>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onClaim}
            disabled={!isConnected}
          >
            Claim NFT
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BidPanel({
  auction,
  isConnected,
  onConnect,
  onPlaceBid,
  onClaim,
}: BidPanelProps) {
  const status = getAuctionStatus(auction);
  const minBid = auction.account.highestBid > 0
    ? auction.account.highestBid + 0.1
    : 1.0;

  return (
    <div className="space-y-4">
      {/* Current Bid Display */}
      <CurrentBidDisplay auction={auction} status={status} />

      {/* Connect Wallet */}
      {!isConnected && (
        <Card>
          <CardBody className="p-4 text-center">
            <p className="font-mondwest text-sm text-content-muted mb-3">
              Connect wallet to place bids
            </p>
            <Button variant="primary" onClick={onConnect}>
              Connect Wallet
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Bid Form (only for live auctions) */}
      {status === 'live' && isConnected && (
        <Card>
          <CardBody className="p-4">
            <p className="font-joystix text-xs text-content-muted mb-3 uppercase">
              Place a Bid
            </p>
            <BidForm
              minBid={minBid}
              onSubmit={onPlaceBid}
              disabled={!isConnected}
            />
          </CardBody>
        </Card>
      )}

      {/* Upcoming Notice */}
      {status === 'upcoming' && (
        <Card>
          <CardBody className="p-4 text-center">
            <p className="font-mondwest text-sm text-content-muted">
              Bidding opens when auction starts
            </p>
          </CardBody>
        </Card>
      )}

      {/* Winner Panel (for ended auctions) */}
      {status === 'ended' && (
        <WinnerPanel
          auction={auction}
          onClaim={onClaim}
          isConnected={isConnected}
        />
      )}
    </div>
  );
}

export default BidPanel;
