// ============================================================================
// Staking Types
// ============================================================================

// Wallet connection states
export type WalletConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected';

// Transaction states (simplified - no 'confirming', wallet handles that)
export type TransactionStatus = 
  | 'idle'           // Ready for input
  | 'signing'        // Wallet popup open, waiting for approval
  | 'pending'        // Transaction submitted, awaiting confirmation
  | 'success'        // Transaction confirmed (briefly, then back to idle)
  | 'error';         // Transaction failed (briefly, then back to idle)

// Staking position for user's existing stakes
export interface StakingPosition {
  stakedAmount: string;
  receivedTokens: string;
  rewards: string;
  apy: string;
}

// Transaction result for hooks
export interface TransactionResult {
  signature?: string;
  error?: string;
  timestamp: Date;
}

// Main staking state interface
export interface StakingState {
  wallet: {
    status: WalletConnectionStatus;
    address: string | null;
    balance: string;
  };
  transaction: {
    status: TransactionStatus;
    amount: string;
    signature?: string;
    error?: string;
  };
  position: StakingPosition | null;
  exchangeRate: string; // SOL to INDIESOL rate (e.g., "1.0")
}
