'use client';

import { Icon } from '@/components/icons';
import type { Filters } from '../types';

interface Props {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  cities: string[];
  stats: { total: number; active: number; land: number; improved: number };
}

const selectBase =
  'bg-surface-secondary text-content-primary border border-edge-primary rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent-primary appearance-none';
const inputBase =
  'bg-surface-secondary text-content-primary border border-edge-primary rounded px-2 py-1 text-xs placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary';

export function PropertyFilters({
  filters,
  onFiltersChange,
  cities,
  stats,
}: Props) {
  const set = (patch: Partial<Filters>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <div className="flex-shrink-0 border-b border-edge-primary bg-surface-secondary/50 px-3 py-2 flex flex-col gap-2">
      {/* Row 1: search + stats */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-content-tertiary"
          />
          <input
            type="text"
            placeholder="Search address, APN, city..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className={`${inputBase} w-full pl-7`}
          />
        </div>
        <span className="text-xs text-content-secondary whitespace-nowrap">
          {stats.total} properties
          <span className="text-content-tertiary ml-1">
            ({stats.land} land, {stats.improved} improved)
          </span>
        </span>
      </div>

      {/* Row 2: filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filters.auctionType}
          onChange={(e) =>
            set({ auctionType: e.target.value as Filters['auctionType'] })
          }
          className={selectBase}
        >
          <option value="all">All Types</option>
          <option value="unimproved">Land Only</option>
          <option value="improved">Improved Only</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            set({ status: e.target.value as Filters['status'] })
          }
          className={selectBase}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="redeemed">Redeemed</option>
        </select>

        <select
          value={filters.city}
          onChange={(e) => set({ city: e.target.value })}
          className={selectBase}
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-edge-primary" />

        <select
          value={`${filters.sortField}:${filters.sortDirection}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(':');
            set({
              sortField: field as Filters['sortField'],
              sortDirection: dir as Filters['sortDirection'],
            });
          }}
          className={selectBase}
        >
          <option value="dealScore:asc">Best Deal</option>
          <option value="openingBid:asc">Bid: Low to High</option>
          <option value="openingBid:desc">Bid: High to Low</option>
          <option value="totalAssessedValue:desc">Value: High to Low</option>
          <option value="totalAssessedValue:asc">Value: Low to High</option>
          <option value="landValue:desc">Land Value: High</option>
        </select>

        <input
          type="number"
          placeholder="Max bid $"
          value={filters.maxBid ?? ''}
          onChange={(e) =>
            set({
              maxBid: e.target.value ? Number(e.target.value) : null,
            })
          }
          className={`${inputBase} w-24`}
        />
      </div>
    </div>
  );
}
