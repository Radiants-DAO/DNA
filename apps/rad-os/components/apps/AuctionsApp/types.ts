/**
 * Auction Types for RadOS Auctions App
 *
 * Re-exports core types from shared mock data and adds app-specific types.
 */

// Re-export core types from shared mock data
export type {
  Auction,
  AuctionMetadata,
  AuctionAccount,
  AuctionStatus,
  Bid,
} from '@/lib/mockData/auctions';

// Re-export helpers
export {
  getAuctionStatus,
  formatTimeRemaining,
  formatAddress,
  mockAuctions,
  mockBidHistory,
} from '@/lib/mockData/auctions';

// ============================================================================
// Vault Types (for NFT management)
// ============================================================================

export interface VaultNFT {
  id: string;
  name: string;
  image?: string;
  collection: string;
  collectionAddress?: string;
  tokenId?: string;
  price?: number;
  currency?: string;
}

export interface VaultCollection {
  id: string;
  name: string;
  nfts: VaultNFT[];
  totalValue?: number;
}

// ============================================================================
// Murder Tree Types (visualization of burned/collected NFTs)
// ============================================================================

export interface MurderTreeItem {
  id: string;
  image?: string;
  name: string;
  isBurned: boolean;
  isTransferred: boolean;
}

export interface MurderTreeData {
  /** Large featured NFTs (typically 3) */
  bigNfts: MurderTreeItem[];
  /** Small NFTs (typically 4) */
  smallNfts: MurderTreeItem[];
  /** Additional count beyond visible items */
  overflowCount: number;
  /** Total value of murdered NFTs */
  totalValue?: number;
}

// ============================================================================
// App State Types
// ============================================================================

export type AuctionTab = 'auction' | 'history' | 'vault';

export interface AuctionsAppState {
  currentAuctionIndex: number;
  activeTab: AuctionTab;
  isConnected: boolean;
  walletAddress: string | null;
  isAdmin: boolean;
}

// ============================================================================
// Selection Types (for batch NFT operations)
// ============================================================================

export interface NFTSelection {
  collectionId: string;
  nftIds: string[];
}

export interface SelectionState {
  selections: Map<string, string[]>;
  totalCount: number;
}
