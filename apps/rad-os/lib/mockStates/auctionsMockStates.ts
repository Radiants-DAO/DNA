/**
 * Auctions App Mock States
 *
 * Defines the mock states available for testing the AuctionsApp.
 * These states are extracted from the reference Webflow frontend patterns.
 */

export interface MockStateDefinition {
  id: string;
  name: string;
  description: string;
  category: 'wallet' | 'auction' | 'user';
  icon?: string;
}

export interface AuctionsMockStates {
  // Wallet states
  isConnected: boolean;
  walletAddress: string | null;

  // User ownership
  ownedRadiants: Array<{
    mintAddress: string;
    name: string;
    image: string;
    radiantNumber: string;
  }>;

  // Auction participation
  isTopBidder: boolean;
  isAuctionWinner: boolean;
  currentBidAmount: number | null;

  // Vault state
  vaultNfts: Array<{
    id: string;
    name: string;
    collection: string;
    image: string;
    floorPrice: number;
  }>;

  // UI state
  isAdmin: boolean;
}

// Default state - wallet disconnected
export const DEFAULT_AUCTIONS_STATE: AuctionsMockStates = {
  isConnected: false,
  walletAddress: null,
  ownedRadiants: [],
  isTopBidder: false,
  isAuctionWinner: false,
  currentBidAmount: null,
  vaultNfts: [],
  isAdmin: false,
};

// Available mock state presets
export const AUCTIONS_MOCK_STATE_DEFINITIONS: MockStateDefinition[] = [
  {
    id: 'wallet-disconnected',
    name: 'Wallet Disconnected',
    description: 'No wallet connected, visitor mode',
    category: 'wallet',
    icon: '🔌',
  },
  {
    id: 'wallet-connected-no-radiants',
    name: 'Connected (No Radiants)',
    description: 'Wallet connected but user owns no radiants',
    category: 'wallet',
    icon: '👛',
  },
  {
    id: 'radiant-holder',
    name: 'Radiant Holder',
    description: 'User owns 1-3 radiants',
    category: 'user',
    icon: '🌟',
  },
  {
    id: 'top-bidder',
    name: 'Top Bidder',
    description: 'User is currently the highest bidder',
    category: 'auction',
    icon: '🏆',
  },
  {
    id: 'auction-winner',
    name: 'Auction Winner',
    description: 'User won a past auction',
    category: 'auction',
    icon: '👑',
  },
  {
    id: 'vault-with-nfts',
    name: 'Vault with NFTs',
    description: 'User has NFTs deposited in vault',
    category: 'user',
    icon: '🏦',
  },
  {
    id: 'admin-mode',
    name: 'Admin Mode',
    description: 'User has admin privileges',
    category: 'user',
    icon: '⚙️',
  },
];

// Mock vault NFTs for testing
const MOCK_VAULT_NFTS = [
  {
    id: 'vault-1',
    name: 'DeGod #1234',
    collection: 'DeGods',
    image: 'https://api.degods.com/v2/image/1234.png',
    floorPrice: 45.2,
  },
  {
    id: 'vault-2',
    name: 'SMB #5678',
    collection: 'SMB Gen2',
    image: 'https://smbgen2.com/image/5678.png',
    floorPrice: 12.5,
  },
  {
    id: 'vault-3',
    name: 'Okay Bear #999',
    collection: 'Okay Bears',
    image: 'https://okaybears.com/image/999.png',
    floorPrice: 25.0,
  },
  {
    id: 'vault-4',
    name: 'Famous Fox #2222',
    collection: 'Famous Fox Federation',
    image: 'https://famousfoxes.com/image/2222.png',
    floorPrice: 8.3,
  },
];

// Mock owned radiants for testing
const MOCK_OWNED_RADIANTS = [
  {
    mintAddress: 'mock-radiant-001',
    name: 'Radiant 001',
    image: '/assets/radiants/radiant-001.avif',
    radiantNumber: '001',
  },
  {
    mintAddress: 'mock-radiant-015',
    name: 'Radiant 015',
    image: '/assets/radiants/radiant-002.avif',
    radiantNumber: '015',
  },
  {
    mintAddress: 'mock-radiant-023',
    name: 'Radiant 023',
    image: '/assets/radiants/radiant-003.avif',
    radiantNumber: '023',
  },
];

// State presets mapped to full state objects
export const AUCTIONS_MOCK_STATE_PRESETS: Record<string, AuctionsMockStates> = {
  'wallet-disconnected': {
    ...DEFAULT_AUCTIONS_STATE,
  },

  'wallet-connected-no-radiants': {
    ...DEFAULT_AUCTIONS_STATE,
    isConnected: true,
    walletAddress: '0x1234...5678',
  },

  'radiant-holder': {
    ...DEFAULT_AUCTIONS_STATE,
    isConnected: true,
    walletAddress: '0xABCD...EF01',
    ownedRadiants: MOCK_OWNED_RADIANTS,
  },

  'top-bidder': {
    ...DEFAULT_AUCTIONS_STATE,
    isConnected: true,
    walletAddress: '0x1234...5678', // Matches highest bidder in current auction
    ownedRadiants: [MOCK_OWNED_RADIANTS[0]],
    isTopBidder: true,
    currentBidAmount: 171.8,
  },

  'auction-winner': {
    ...DEFAULT_AUCTIONS_STATE,
    isConnected: true,
    walletAddress: '0xABCD...EF01', // Matches winner address in mock data
    ownedRadiants: MOCK_OWNED_RADIANTS,
    isAuctionWinner: true,
  },

  'vault-with-nfts': {
    ...DEFAULT_AUCTIONS_STATE,
    isConnected: true,
    walletAddress: '0x1234...5678',
    vaultNfts: MOCK_VAULT_NFTS,
  },

  'admin-mode': {
    ...DEFAULT_AUCTIONS_STATE,
    isConnected: true,
    walletAddress: '0xADMIN...1234',
    ownedRadiants: MOCK_OWNED_RADIANTS,
    isAdmin: true,
  },
};

/**
 * Get the mock state preset by ID
 */
export function getMockStatePreset(stateId: string): AuctionsMockStates {
  return AUCTIONS_MOCK_STATE_PRESETS[stateId] || DEFAULT_AUCTIONS_STATE;
}

/**
 * Get mock state definitions by category
 */
export function getMockStatesByCategory(category: MockStateDefinition['category']): MockStateDefinition[] {
  return AUCTIONS_MOCK_STATE_DEFINITIONS.filter((def) => def.category === category);
}
