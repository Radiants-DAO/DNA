'use client';

import { Button } from '@rdna/radiants/components/core';
import type { AuctionProperty } from '../types';

interface Props {
  property: AuctionProperty;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function getDealLabel(score: number | null): {
  label: string;
  color: string;
} | null {
  if (score === null) return null;
  if (score <= 0.3) return { label: 'Great', color: 'text-status-success bg-status-success/20' };
  if (score <= 0.5) return { label: 'Good', color: 'text-status-success bg-status-success/10' };
  if (score <= 0.7) return { label: 'Fair', color: 'text-status-warning bg-status-warning/20' };
  return { label: 'High', color: 'text-status-error bg-status-error/20' };
}

export function PropertyCard({
  property: p,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: Props) {
  const deal = getDealLabel(p.dealScore);
  const isInactive = p.status !== 'active';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSelect(p.id)}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      className={`w-full text-left px-3 py-2.5 border-b border-edge-primary transition-colors ${
        isSelected
          ? 'bg-action-primary/10 border-l-2 border-l-action-primary'
          : isHovered
            ? 'bg-surface-secondary/80'
            : 'bg-transparent'
      } ${isInactive ? 'opacity-50' : ''}`}
    >
      {/* Row 1: Address + Type badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-tight line-clamp-2">
          {p.address}
        </p>
        <span
          className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
            p.auctionType === 'unimproved'
              ? 'bg-status-success/20 text-status-success'
              : 'bg-status-info/20 text-status-info'
          }`}
        >
          {p.auctionType === 'unimproved' ? 'Land' : 'Improved'}
        </span>
      </div>

      {/* Row 2: City + Status */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-sm text-content-secondary">
          {p.city}, {p.zip}
        </span>
        {p.status !== 'active' && (
          <span className="text-xs px-1 py-0.5 rounded bg-surface-secondary text-content-tertiary uppercase">
            {p.status}
          </span>
        )}
      </div>

      {/* Row 3: Financials */}
      <div className="flex items-center gap-3 mt-1.5">
        <div>
          <span className="text-xs text-content-tertiary block">
            Opening Bid
          </span>
          <span className="text-sm font-semibold">
            {formatCurrency(p.openingBid)}
          </span>
        </div>
        <div>
          <span className="text-xs text-content-tertiary block">
            Assessed
          </span>
          <span className="text-xs text-content-secondary">
            {formatCurrency(p.totalAssessedValue)}
          </span>
        </div>
        {deal && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-auto ${deal.color}`}
          >
            {deal.label} Deal
          </span>
        )}
      </div>

      {/* Row 4: Links */}
      <div className="flex items-center gap-2 mt-1.5">
        <a
          href={p.externalLinks.zillow}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-content-link hover:underline"
        >
          Zillow
        </a>
        <a
          href={p.externalLinks.redfin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-content-link hover:underline"
        >
          Redfin
        </a>
        <a
          href={p.externalLinks.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-content-link hover:underline"
        >
          Maps
        </a>
        <span className="text-xs text-content-tertiary ml-auto">
          APN: {p.apn}
        </span>
      </div>
    </Button>
  );
}
