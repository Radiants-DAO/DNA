import type { NFTItem } from '@/store/burnSlice';

/** Mock NFTs "owned" by the connected wallet for a Ded Monkes radiator */
export const mockHolderNFTs: NFTItem[] = [
  { mint: 'DM1aXx01', name: 'Ded Monke #1247', image: '/mock/dm-1247.svg', uri: 'https://arweave.net/mock/dm-1247' },
  { mint: 'DM1aXx02', name: 'Ded Monke #0891', image: '/mock/dm-0891.svg', uri: 'https://arweave.net/mock/dm-0891' },
  { mint: 'DM1aXx03', name: 'Ded Monke #2044', image: '/mock/dm-2044.svg', uri: 'https://arweave.net/mock/dm-2044' },
  { mint: 'DM1aXx04', name: 'Ded Monke #0330', image: '/mock/dm-0330.svg', uri: 'https://arweave.net/mock/dm-0330' },
  { mint: 'DM1aXx05', name: 'Ded Monke #1776', image: '/mock/dm-1776.svg', uri: 'https://arweave.net/mock/dm-1776' },
  { mint: 'DM1aXx06', name: 'Ded Monke #0512', image: '/mock/dm-0512.svg', uri: 'https://arweave.net/mock/dm-0512' },
  { mint: 'DM1aXx07', name: 'Ded Monke #3301', image: '/mock/dm-3301.svg', uri: 'https://arweave.net/mock/dm-3301' },
  { mint: 'DM1aXx08', name: 'Ded Monke #0042', image: '/mock/dm-0042.svg', uri: 'https://arweave.net/mock/dm-0042' },
];

/** Mock 1/1 reward art revealed after completing a radiator */
export const mockRewardArt = {
  name: 'Radiated Monke #1247',
  image: '/mock/reward-rad.svg',
  uri: 'https://arweave.net/mock/rad-1247',
};

/** Mock art items for the admin upload flow */
export const mockAdminArt = [
  { name: 'Radiated Monke — Gold', image: '/mock/art-gold.svg' },
  { name: 'Radiated Monke — Chrome', image: '/mock/art-chrome.svg' },
  { name: 'Radiated Monke — Neon', image: '/mock/art-neon.svg' },
];
