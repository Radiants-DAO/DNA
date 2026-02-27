export interface MockRadiator {
  name: string;
  collection: string;
  image: string;
  offeringSize: number;
  totalBurnt: number;
  totalValue: number;
  revealUpfront: boolean;
}

export const mockRadiators: MockRadiator[] = [
  {
    name: 'Ded Monkes',
    collection: 'DedMo...nke1',
    image: 'https://placehold.co/400x400/FCE184/0F0E0C?text=DM',
    offeringSize: 3,
    totalBurnt: 3021,
    totalValue: 435.25,
    revealUpfront: true,
  },
  {
    name: 'Sol Skulls',
    collection: 'SoSku...lls2',
    image: 'https://placehold.co/400x400/0F0E0C/FCE184?text=SS',
    offeringSize: 5,
    totalBurnt: 12480,
    totalValue: 891.40,
    revealUpfront: false,
  },
  {
    name: 'Quantum Foxes',
    collection: 'QFoxe...xes3',
    image: 'https://placehold.co/400x400/FCE184/0F0E0C?text=QF',
    offeringSize: 2,
    totalBurnt: 6230,
    totalValue: 312.80,
    revealUpfront: true,
  },
  {
    name: 'Neon Glyphs',
    collection: 'NeoGl...ph4',
    image: 'https://placehold.co/400x400/0F0E0C/FCE184?text=NG',
    offeringSize: 4,
    totalBurnt: 10580,
    totalValue: 720.35,
    revealUpfront: false,
  },
];

export const mockGlobalStats = {
  totalIrradiated: 32311,
  totalValueBurnt: 2359.80,
};

/** Mock NFTs "owned" by the connected wallet for the selected radiator */
export interface MockNFT {
  mint: string;
  name: string;
  image: string;
  uri: string;
}

export const mockHolderNFTs: MockNFT[] = [
  { mint: 'DM1a...xx01', name: 'Ded Monke #1247', image: 'https://placehold.co/400x400/FCE184/0F0E0C?text=1247', uri: '' },
  { mint: 'DM1a...xx02', name: 'Ded Monke #0891', image: 'https://placehold.co/400x400/E8D06E/0F0E0C?text=0891', uri: '' },
  { mint: 'DM1a...xx03', name: 'Ded Monke #2044', image: 'https://placehold.co/400x400/D4BC58/0F0E0C?text=2044', uri: '' },
  { mint: 'DM1a...xx04', name: 'Ded Monke #0330', image: 'https://placehold.co/400x400/C0A842/0F0E0C?text=0330', uri: '' },
  { mint: 'DM1a...xx05', name: 'Ded Monke #1776', image: 'https://placehold.co/400x400/AE962E/0F0E0C?text=1776', uri: '' },
  { mint: 'DM1a...xx06', name: 'Ded Monke #0512', image: 'https://placehold.co/400x400/9C8418/0F0E0C?text=0512', uri: '' },
];

/** Mock reward 1/1 art for upfront-reveal radiators */
export const mockRewardArt = {
  name: 'Radiated Monke #1247',
  image: 'https://placehold.co/400x400/FF6B35/0F0E0C?text=RAD',
  uri: '',
};
