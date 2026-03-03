export interface AuctionProperty {
  id: string;
  apn: string;
  address: string;
  city: string;
  zip: string;
  auctionType: 'improved' | 'unimproved' | 'timeshare' | 'unknown';
  landValue: number;
  improvements: number;
  totalAssessedValue: number;
  openingBid: number;
  status: 'active' | 'withdrawn' | 'redeemed';
  description: string;
  coordinates: { lat: number; lng: number } | null;
  dealScore: number | null;
  externalLinks: {
    zillow: string;
    redfin: string;
    googleMaps: string;
  };
}

export type SortField =
  | 'openingBid'
  | 'totalAssessedValue'
  | 'landValue'
  | 'dealScore';

export type SortDirection = 'asc' | 'desc';

export interface Filters {
  auctionType: 'all' | 'improved' | 'unimproved';
  status: 'all' | 'active' | 'withdrawn' | 'redeemed';
  city: string; // '' = all
  search: string;
  sortField: SortField;
  sortDirection: SortDirection;
  maxBid: number | null; // null = no limit
}

export const DEFAULT_FILTERS: Filters = {
  auctionType: 'all',
  status: 'active',
  city: '',
  search: '',
  sortField: 'dealScore',
  sortDirection: 'asc',
  maxBid: null,
};
