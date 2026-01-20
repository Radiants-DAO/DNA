// Mock auction data for the Auctions app

export interface AuctionMetadata {
  name: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
}

export interface AuctionAccount {
  startTimestamp: number;
  endTimestamp: number;
  winner: string | null;
  highestBidder: string | null;
  highestBid: number; // in ETH
  isClaimed: boolean;
}

export interface Auction {
  auctionId: string;
  version: 'v1' | 'v2';
  metadata: AuctionMetadata;
  account: AuctionAccount;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  amount: number;
  timestamp: number;
}

// Helper to generate timestamps
const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

export const mockAuctions: Auction[] = [
  {
    auctionId: 'auction-42',
    version: 'v2',
    metadata: {
      name: 'Radiant #42 - Cowboy',
      image: '/assets/radiants/radiant-001.avif',
      attributes: [
        { trait_type: 'Background', value: 'Sunset Gradient' },
        { trait_type: 'Body', value: 'Golden' },
        { trait_type: 'Eyes', value: 'Laser' },
        { trait_type: 'Accessory', value: 'Crown' },
        { trait_type: 'Rarity', value: 'Legendary' },
      ],
    },
    account: {
      startTimestamp: now - 2 * day,
      endTimestamp: now + 1 * day + 12 * hour,
      winner: null,
      highestBidder: '0x1234...5678',
      highestBid: 15.5,
      isClaimed: false,
    },
  },
  {
    auctionId: 'auction-41',
    version: 'v2',
    metadata: {
      name: 'Radiant #41 - Woman',
      image: '/assets/radiants/radiant-002.avif',
      attributes: [
        { trait_type: 'Background', value: 'Digital Rain' },
        { trait_type: 'Body', value: 'Glitch' },
        { trait_type: 'Eyes', value: 'Binary' },
        { trait_type: 'Accessory', value: 'Data Visor' },
        { trait_type: 'Rarity', value: 'Rare' },
      ],
    },
    account: {
      startTimestamp: now - 5 * day,
      endTimestamp: now - 1 * day,
      winner: '0xABCD...EF01',
      highestBidder: '0xABCD...EF01',
      highestBid: 12.3,
      isClaimed: true,
    },
  },
  {
    auctionId: 'auction-43',
    version: 'v2',
    metadata: {
      name: 'Radiant #43 - Kemo Cowboy',
      image: '/assets/radiants/radiant-003.avif',
      attributes: [
        { trait_type: 'Background', value: 'Cyberpunk City' },
        { trait_type: 'Body', value: 'Chrome' },
        { trait_type: 'Eyes', value: 'Neon Pink' },
        { trait_type: 'Accessory', value: 'Hoverboard' },
        { trait_type: 'Rarity', value: 'Epic' },
      ],
    },
    account: {
      startTimestamp: now + 2 * day,
      endTimestamp: now + 5 * day,
      winner: null,
      highestBidder: null,
      highestBid: 0,
      isClaimed: false,
    },
  },
  {
    auctionId: 'auction-40',
    version: 'v1',
    metadata: {
      name: 'Radiant #40 - Cosmic Voyager',
      image: '/assets/radiants/radiant-001.avif',
      attributes: [
        { trait_type: 'Background', value: 'Starfield' },
        { trait_type: 'Body', value: 'Nebula' },
        { trait_type: 'Eyes', value: 'Galaxy' },
        { trait_type: 'Accessory', value: 'Space Helmet' },
        { trait_type: 'Rarity', value: 'Uncommon' },
      ],
    },
    account: {
      startTimestamp: now - 10 * day,
      endTimestamp: now - 7 * day,
      winner: '0x9876...5432',
      highestBidder: '0x9876...5432',
      highestBid: 8.75,
      isClaimed: true,
    },
  },
  {
    auctionId: 'auction-44',
    version: 'v2',
    metadata: {
      name: 'Radiant #44 - Retro Wave',
      image: '/assets/radiants/radiant-002.avif',
      attributes: [
        { trait_type: 'Background', value: 'VHS Static' },
        { trait_type: 'Body', value: 'Scanlines' },
        { trait_type: 'Eyes', value: 'CRT Glow' },
        { trait_type: 'Accessory', value: 'Boombox' },
        { trait_type: 'Rarity', value: 'Rare' },
      ],
    },
    account: {
      startTimestamp: now + 7 * day,
      endTimestamp: now + 10 * day,
      winner: null,
      highestBidder: null,
      highestBid: 0,
      isClaimed: false,
    },
  },
];

export const mockBidHistory: Bid[] = [
  {
    id: 'bid-1',
    auctionId: 'auction-42',
    bidder: '0x1234...5678',
    amount: 15.5,
    timestamp: now - 2 * hour,
  },
  {
    id: 'bid-2',
    auctionId: 'auction-42',
    bidder: '0xAAAA...BBBB',
    amount: 14.0,
    timestamp: now - 5 * hour,
  },
  {
    id: 'bid-3',
    auctionId: 'auction-42',
    bidder: '0x1234...5678',
    amount: 12.5,
    timestamp: now - 8 * hour,
  },
  {
    id: 'bid-4',
    auctionId: 'auction-42',
    bidder: '0xCCCC...DDDD',
    amount: 11.0,
    timestamp: now - 12 * hour,
  },
  {
    id: 'bid-5',
    auctionId: 'auction-42',
    bidder: '0xAAAA...BBBB',
    amount: 10.0,
    timestamp: now - 1 * day,
  },
];

export type AuctionStatus = 'live' | 'ended' | 'upcoming';

export function getAuctionStatus(auction: Auction): AuctionStatus {
  const now = Date.now();
  if (now < auction.account.startTimestamp) return 'upcoming';
  if (now > auction.account.endTimestamp) return 'ended';
  return 'live';
}

export function formatTimeRemaining(endTimestamp: number): string {
  const diff = endTimestamp - Date.now();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function formatAddress(address: string): string {
  if (address.includes('...')) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
