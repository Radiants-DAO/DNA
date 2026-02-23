'use client';

import React from 'react';
import { Card, CardBody, Badge } from '@rdna/radiants/components/core';
import { type Bid, formatAddress } from '../types';

// ============================================================================
// Types
// ============================================================================

interface BidHistoryProps {
  bids: Bid[];
  currentHighestBid?: number;
}

// ============================================================================
// Bid Item Component
// ============================================================================

function BidItem({ bid, isHighest }: { bid: Bid; isHighest: boolean }) {
  const timestamp = new Date(bid.timestamp);
  const timeAgo = getTimeAgo(bid.timestamp);

  return (
    <div
      className={`
        flex items-center justify-between p-3
        ${isHighest ? 'bg-sun-yellow/20' : 'bg-surface-muted'}
        rounded-sm
        border border-edge-muted
      `}
    >
      <div className="flex items-center gap-3">
        {/* Bidder avatar placeholder */}
        <div className="w-8 h-8 rounded-sm bg-surface-elevated border border-edge-primary flex items-center justify-center">
          <span className="text-sm">👤</span>
        </div>
        <div>
          <p className="font-mono text-xs text-content-primary">
            {formatAddress(bid.bidder)}
            {isHighest && (
              <Badge variant="success" size="sm" className="ml-2">
                Leading
              </Badge>
            )}
          </p>
          <p className="font-mono text-2xs text-content-muted" title={timestamp.toLocaleString()}>
            {timeAgo}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={isHighest ? 'warning' : 'default'}>
          {bid.amount} SOL
        </Badge>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// ============================================================================
// Main Component
// ============================================================================

export function BidHistory({ bids, currentHighestBid }: BidHistoryProps) {
  // Sort bids by timestamp (most recent first)
  const sortedBids = [...bids].sort((a, b) => b.timestamp - a.timestamp);

  if (sortedBids.length === 0) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="font-mondwest text-sm text-content-muted">
            No bids yet
          </p>
          <p className="font-mono text-2xs text-content-muted mt-1">
            Be the first to place a bid!
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="font-joystix text-xs text-content-primary">
          Bid History
        </p>
        <p className="font-mono text-xs text-content-muted">
          {sortedBids.length} bid{sortedBids.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Bid List */}
      <div className="space-y-2">
        {sortedBids.map((bid, index) => (
          <BidItem
            key={bid.id}
            bid={bid}
            isHighest={index === 0 && bid.amount === currentHighestBid}
          />
        ))}
      </div>

      {/* Stats */}
      {sortedBids.length >= 2 && (
        <Card variant="default">
          <CardBody className="p-3">
            <div className="flex justify-between text-center">
              <div>
                <p className="font-mono text-2xs text-content-muted uppercase">
                  Starting Bid
                </p>
                <p className="font-mondwest text-sm text-content-primary">
                  {sortedBids[sortedBids.length - 1].amount} SOL
                </p>
              </div>
              <div>
                <p className="font-mono text-2xs text-content-muted uppercase">
                  Increase
                </p>
                <p className="font-mondwest text-sm text-content-primary">
                  +{(((sortedBids[0].amount - sortedBids[sortedBids.length - 1].amount) / sortedBids[sortedBids.length - 1].amount) * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="font-mono text-2xs text-content-muted uppercase">
                  Unique Bidders
                </p>
                <p className="font-mondwest text-sm text-content-primary">
                  {new Set(sortedBids.map((b) => b.bidder)).size}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default BidHistory;
