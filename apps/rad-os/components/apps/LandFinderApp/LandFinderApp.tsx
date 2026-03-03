'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AppProps } from '@/lib/constants';
import type { AuctionProperty, Filters } from './types';
import { DEFAULT_FILTERS } from './types';
import { PropertyMap } from './components/PropertyMap';
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
import propertiesData from '@/lib/mockData/auction-properties.json';

const properties = propertiesData as AuctionProperty[];

function filterAndSort(
  items: AuctionProperty[],
  filters: Filters
): AuctionProperty[] {
  let result = items;

  // Type filter
  if (filters.auctionType !== 'all') {
    result = result.filter((p) => p.auctionType === filters.auctionType);
  }

  // Status filter
  if (filters.status !== 'all') {
    result = result.filter((p) => p.status === filters.status);
  }

  // City filter
  if (filters.city) {
    result = result.filter((p) => p.city === filters.city);
  }

  // Max bid filter
  if (filters.maxBid !== null) {
    result = result.filter((p) => p.openingBid <= filters.maxBid!);
  }

  // Text search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.address.toLowerCase().includes(q) ||
        p.apn.includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  // Sort
  const dir = filters.sortDirection === 'asc' ? 1 : -1;
  result = [...result].sort((a, b) => {
    const av = a[filters.sortField] ?? Infinity;
    const bv = b[filters.sortField] ?? Infinity;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  return result;
}

export function LandFinderApp({ windowId }: AppProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterAndSort(properties, filters),
    [filters]
  );

  const cities = useMemo(() => {
    const set = new Set(properties.map((p) => p.city));
    return Array.from(set).sort();
  }, []);

  const selectedProperty = useMemo(
    () => filtered.find((p) => p.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const stats = useMemo(() => {
    const active = filtered.filter((p) => p.status === 'active').length;
    const land = filtered.filter((p) => p.auctionType === 'unimproved').length;
    const improved = filtered.filter(
      (p) => p.auctionType === 'improved'
    ).length;
    return { total: filtered.length, active, land, improved };
  }, [filtered]);

  return (
    <div className="h-full bg-surface-primary flex flex-col overflow-hidden text-content-primary">
      {/* Filter bar */}
      <PropertyFilters
        filters={filters}
        onFiltersChange={setFilters}
        cities={cities}
        stats={stats}
      />

      {/* Split view */}
      <div className="flex-1 min-h-0 flex">
        {/* Map panel */}
        <div className="flex-1 min-w-0 relative">
          <PropertyMap
            properties={filtered}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        </div>

        {/* Divider */}
        <div className="w-px bg-edge-primary flex-shrink-0" />

        {/* List panel */}
        <div className="w-[320px] flex-shrink-0 overflow-y-auto">
          <PropertyList
            properties={filtered}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        </div>
      </div>
    </div>
  );
}

export default LandFinderApp;
