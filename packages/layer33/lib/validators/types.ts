// Base validator from GitHub-hosted validators.json
export interface Validator {
  displayName: string;
  identityKey: string;
  voteAccount: string;
}

// Response from validators.json
export interface ValidatorResponse {
  validators: Validator[];
}

// Trillium API response for validator rewards
export interface ValidatorReward {
  _Trillium_Attribution: string;
  activated_stake: number;
  identity_pubkey: string;
  vote_account_pubkey: string;
  name: string;
  commission: number;
  epoch: number;
  stake_percentage: number;
  delegator_compound_total_apy: number;
  total_overall_apy: number;
  blocks_produced: number;
  skip_rate: string;
  icon_url: string | null;
  logo: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  [key: string]: unknown;
}

// Enriched validator with stake and performance data
export interface ValidatorWithStake extends Validator {
  activatedStake: number;
  stakePercentage: number;
  apy?: number;
  commission?: number;
  blocksProduced?: number;
  skipRate?: string;
  iconUrl?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lon?: number | null;
}

// Aggregate data for the StatsCard
export interface ValidatorStakeData {
  validators: ValidatorWithStake[];
  totalStake: number;
  epoch: number;
  totalNetworkStake: number;
  layer33Percentage: number;
}

// Solana RPC types
export interface EpochInfo {
  absoluteSlot: number;
  blockHeight: number;
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  transactionCount: number;
}

export interface SolanaRPCResponse<T> {
  jsonrpc: string;
  result: T;
  id: number;
}
