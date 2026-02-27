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
