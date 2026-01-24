import {
  Validator,
  ValidatorResponse,
  ValidatorReward,
  ValidatorWithStake,
  ValidatorStakeData,
  EpochInfo,
  SolanaRPCResponse,
} from './types';

const VALIDATORS_URL =
  'https://raw.githubusercontent.com/brewlabshq/layer33/refs/heads/main/validators.json';
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const TRILLIUM_API_URL = 'https://api.trillium.so/validator_rewards';

/**
 * Fetch Layer33 validators from GitHub
 */
export async function getValidators(): Promise<ValidatorResponse> {
  const response = await fetch(VALIDATORS_URL, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error('Failed to fetch validators');
  }

  return response.json();
}

/**
 * Get current epoch from Solana RPC
 */
export async function getCurrentEpoch(): Promise<number> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getEpochInfo',
      params: [
        {
          commitment: 'finalized',
        },
      ],
    }),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error('Failed to fetch epoch info from Solana RPC');
  }

  const data: SolanaRPCResponse<EpochInfo> = await response.json();
  return data.result.epoch;
}

/**
 * Fetch validator rewards from Trillium API
 */
export async function getValidatorRewards(
  epoch: number
): Promise<ValidatorReward[]> {
  const response = await fetch(`${TRILLIUM_API_URL}/${epoch}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch validator rewards for epoch ${epoch}`);
  }

  const data: ValidatorReward[] = await response.json();
  return data;
}

/**
 * Combine validator data with stake and performance metrics
 */
export async function getValidatorStakeData(
  layer33Validators: Validator[]
): Promise<ValidatorStakeData> {
  try {
    // Get current epoch
    const currentEpoch = await getCurrentEpoch();

    // Get previous epoch data (current epoch data may be incomplete)
    const previousEpoch = currentEpoch - 1;

    // Fetch validator rewards from Trillium
    const allValidatorRewards = await getValidatorRewards(previousEpoch);

    // Create a map for quick lookup by identity key and vote account
    const rewardsMap = new Map<string, ValidatorReward>();
    allValidatorRewards.forEach((reward) => {
      rewardsMap.set(reward.identity_pubkey, reward);
      rewardsMap.set(reward.vote_account_pubkey, reward);
    });

    // Calculate total network stake from all validators
    const totalNetworkStake = allValidatorRewards.reduce(
      (sum, validator) => sum + validator.activated_stake,
      0
    );

    // Match Layer33 validators with Trillium data
    const validatorsWithStake: ValidatorWithStake[] = layer33Validators.map(
      (validator) => {
        // Try to match by identity key first, then by vote account
        const rewardData =
          rewardsMap.get(validator.identityKey) ||
          rewardsMap.get(validator.voteAccount);

        if (rewardData) {
          return {
            ...validator,
            activatedStake: rewardData.activated_stake,
            stakePercentage: rewardData.stake_percentage,
            apy: rewardData.delegator_compound_total_apy,
            commission: rewardData.commission,
            blocksProduced: rewardData.blocks_produced,
            skipRate: rewardData.skip_rate,
            iconUrl: rewardData.icon_url,
            location: rewardData.location,
            city: rewardData.city,
            country: rewardData.country,
            lat: rewardData.lat,
            lon: rewardData.lon,
          };
        }

        // If no match found, return with 0 stake
        return {
          ...validator,
          activatedStake: 0,
          stakePercentage: 0,
        };
      }
    );

    // Calculate total stake for Layer33 validators
    const totalStake = validatorsWithStake.reduce(
      (sum, validator) => sum + validator.activatedStake,
      0
    );

    // Calculate Layer33's percentage of total network stake
    const layer33Percentage =
      totalNetworkStake > 0 ? (totalStake / totalNetworkStake) * 100 : 0;

    // Sort validators by stake amount (highest first)
    const sortedValidators = validatorsWithStake.sort(
      (a, b) => b.activatedStake - a.activatedStake
    );

    return {
      validators: sortedValidators,
      totalStake,
      epoch: previousEpoch,
      totalNetworkStake,
      layer33Percentage,
    };
  } catch (error) {
    console.error('Error fetching validator stake data:', error);

    // Return empty data on error
    return {
      validators: layer33Validators.map((v) => ({
        ...v,
        activatedStake: 0,
        stakePercentage: 0,
      })),
      totalStake: 0,
      epoch: 0,
      totalNetworkStake: 0,
      layer33Percentage: 0,
    };
  }
}
