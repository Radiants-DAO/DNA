'use client';

import React from 'react';
import { NFTCard } from './NFTCard';

// ============================================================================
// Types
// ============================================================================

interface NFTItem {
  id: string;
  image?: string;
  name: string;
  collection?: string;
  tokenId?: string;
  price?: string;
  currency?: string;
  badge?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

type NFTGridColumns = 2 | 3 | 4 | 'auto';
type NFTGridSize = 'sm' | 'md' | 'lg';

interface NFTGridProps {
  /** Array of NFT items to display */
  items: NFTItem[];
  /** Number of columns (or 'auto' for responsive) */
  columns?: NFTGridColumns;
  /** Size of NFT cards */
  cardSize?: NFTGridSize;
  /** Enable selection mode */
  selectable?: boolean;
  /** Currently selected item IDs */
  selectedIds?: string[];
  /** Selection change handler */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Single item click handler */
  onItemClick?: (item: NFTItem) => void;
  /** Maximum items to show (with "show more" option) */
  maxItems?: number;
  /** Show more click handler */
  onShowMore?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const columnStyles: Record<NFTGridColumns, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  auto: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
};

// ============================================================================
// Component
// ============================================================================

/**
 * NFTGrid component for displaying collections of NFTs
 *
 * Features:
 * - Configurable grid columns
 * - Selection mode with multi-select
 * - Max items with "show more"
 * - Empty and loading states
 */
export function NFTGrid({
  items,
  columns = 'auto',
  cardSize = 'md',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onItemClick,
  maxItems,
  onShowMore,
  emptyMessage = 'No NFTs found',
  loading = false,
  className = '',
}: NFTGridProps) {
  const handleSelect = (id: string, selected: boolean) => {
    if (!onSelectionChange) return;

    if (selected) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((itemId) => itemId !== id));
    }
  };

  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  // Loading state
  if (loading) {
    return (
      <div className={`grid ${columnStyles[columns]} gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-surface-primary border border-edge-primary rounded-md animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={`
          p-8 text-center
          bg-surface-primary border border-edge-primary rounded-md
          ${className}
        `}
      >
        <div className="text-4xl mb-2">📭</div>
        <p className="font-mondwest text-sm text-content-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`grid ${columnStyles[columns]} gap-4`}>
        {displayItems.map((item) => (
          <NFTCard
            key={item.id}
            image={item.image}
            name={item.name}
            collection={item.collection}
            tokenId={item.tokenId}
            price={item.price}
            currency={item.currency}
            badge={item.badge}
            attributes={item.attributes}
            size={cardSize}
            variant={selectable ? 'selectable' : 'default'}
            selected={selectedIds.includes(item.id)}
            onSelect={
              selectable
                ? (selected) => handleSelect(item.id, selected)
                : undefined
            }
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          />
        ))}
      </div>

      {/* Show more button */}
      {hasMore && onShowMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onShowMore}
            className="
              font-joystix text-xs uppercase
              px-4 py-2
              border border-edge-primary rounded-sm
              bg-surface-elevated hover:bg-sun-yellow
              transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus
            "
          >
            Show {items.length - maxItems} more
          </button>
        </div>
      )}

      {/* Selection summary */}
      {selectable && selectedIds.length > 0 && (
        <div
          className="
            mt-4 p-3
            bg-sun-yellow/20 border border-edge-primary rounded-sm
            flex items-center justify-between
          "
        >
          <span className="font-mondwest text-sm">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}{' '}
            selected
          </span>
          <button
            onClick={() => onSelectionChange?.([])}
            className="font-joystix text-xs uppercase text-content-muted hover:text-content-primary"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export default NFTGrid;
