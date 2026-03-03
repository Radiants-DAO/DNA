'use client';

import { useRef, useEffect } from 'react';
import type { AuctionProperty } from '../types';
import { PropertyCard } from './PropertyCard';

interface Props {
  properties: AuctionProperty[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}

export function PropertyList({
  properties,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll selected card into view when selection changes (e.g. from map click)
  useEffect(() => {
    if (!selectedId) return;
    const el = cardRefs.current.get(selectedId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-sm text-content-tertiary text-center">
          No properties match your filters.
          <br />
          Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full">
      {properties.map((p) => (
        <div
          key={p.id}
          ref={(el) => {
            if (el) cardRefs.current.set(p.id, el);
            else cardRefs.current.delete(p.id);
          }}
        >
          <PropertyCard
            property={p}
            isSelected={selectedId === p.id}
            isHovered={hoveredId === p.id}
            onSelect={onSelect}
            onHover={onHover}
          />
        </div>
      ))}
    </div>
  );
}
