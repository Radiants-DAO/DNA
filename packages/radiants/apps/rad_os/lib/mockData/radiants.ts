// Mock Radiant data for Murder Tree visualization

export interface BurnedNFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  burnDate: number;
  value?: number; // ETH value at time of burn
}

export interface CommissionedNFT extends BurnedNFT {
  contributor: string;
}

export interface Radiant {
  id: string;
  name: string;
  image: string;
  owner: string;
  creationBranch: BurnedNFT[];
  ownerBranch: BurnedNFT[];
  commissionBranch: CommissionedNFT[];
}

// Helper for timestamps
const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const mockRadiants: Radiant[] = [
  {
    id: 'radiant-42',
    name: 'Radiant #42 - Golden Dawn',
    image: '/assets/nfts/radiant-42.png',
    owner: '0x1234...5678',
    creationBranch: [
      {
        id: 'burn-c1',
        name: 'Bored Ape #8472',
        collection: 'Bored Ape Yacht Club',
        image: '/assets/nfts/bayc-placeholder.png',
        burnDate: now - 30 * day,
        value: 45.5,
      },
      {
        id: 'burn-c2',
        name: 'Azuki #2341',
        collection: 'Azuki',
        image: '/assets/nfts/azuki-placeholder.png',
        burnDate: now - 30 * day,
        value: 12.3,
      },
      {
        id: 'burn-c3',
        name: 'Moonbird #5567',
        collection: 'Moonbirds',
        image: '/assets/nfts/moonbird-placeholder.png',
        burnDate: now - 30 * day,
        value: 8.7,
      },
    ],
    ownerBranch: [
      {
        id: 'burn-o1',
        name: 'Pudgy Penguin #1234',
        collection: 'Pudgy Penguins',
        image: '/assets/nfts/pudgy-placeholder.png',
        burnDate: now - 15 * day,
        value: 5.2,
      },
      {
        id: 'burn-o2',
        name: 'Doodle #9876',
        collection: 'Doodles',
        image: '/assets/nfts/doodle-placeholder.png',
        burnDate: now - 10 * day,
        value: 3.8,
      },
    ],
    commissionBranch: [
      {
        id: 'comm-1',
        name: 'Golden Tribute',
        collection: 'Community Art',
        image: '/assets/nfts/comm-placeholder.png',
        burnDate: now - 5 * day,
        contributor: '0xABCD...EF01',
        value: 0.5,
      },
    ],
  },
  {
    id: 'radiant-41',
    name: 'Radiant #41 - Pixel Storm',
    image: '/assets/nfts/radiant-41.png',
    owner: '0xABCD...EF01',
    creationBranch: [
      {
        id: 'burn-c4',
        name: 'CryptoPunk #7234',
        collection: 'CryptoPunks',
        image: '/assets/nfts/punk-placeholder.png',
        burnDate: now - 60 * day,
        value: 78.0,
      },
      {
        id: 'burn-c5',
        name: 'Clone X #12345',
        collection: 'Clone X',
        image: '/assets/nfts/clonex-placeholder.png',
        burnDate: now - 60 * day,
        value: 15.2,
      },
    ],
    ownerBranch: [
      {
        id: 'burn-o3',
        name: 'World of Women #4567',
        collection: 'World of Women',
        image: '/assets/nfts/wow-placeholder.png',
        burnDate: now - 45 * day,
        value: 4.5,
      },
      {
        id: 'burn-o4',
        name: 'Cool Cat #8901',
        collection: 'Cool Cats',
        image: '/assets/nfts/coolcat-placeholder.png',
        burnDate: now - 40 * day,
        value: 2.1,
      },
      {
        id: 'burn-o5',
        name: 'Meebits #3456',
        collection: 'Meebits',
        image: '/assets/nfts/meebit-placeholder.png',
        burnDate: now - 35 * day,
        value: 3.3,
      },
    ],
    commissionBranch: [
      {
        id: 'comm-2',
        name: 'Pixel Storm Art',
        collection: 'Community Art',
        image: '/assets/nfts/comm-placeholder.png',
        burnDate: now - 20 * day,
        contributor: '0x9999...0000',
        value: 0.8,
      },
      {
        id: 'comm-3',
        name: 'Digital Rain',
        collection: 'Community Art',
        image: '/assets/nfts/comm-placeholder.png',
        burnDate: now - 18 * day,
        contributor: '0x1111...2222',
        value: 0.3,
      },
    ],
  },
  {
    id: 'radiant-40',
    name: 'Radiant #40 - Cosmic Voyager',
    image: '/assets/nfts/radiant-40.png',
    owner: '0x9876...5432',
    creationBranch: [
      {
        id: 'burn-c6',
        name: 'Invisible Friends #789',
        collection: 'Invisible Friends',
        image: '/assets/nfts/invisible-placeholder.png',
        burnDate: now - 90 * day,
        value: 6.5,
      },
    ],
    ownerBranch: [
      {
        id: 'burn-o6',
        name: 'Goblintown #666',
        collection: 'Goblintown',
        image: '/assets/nfts/goblin-placeholder.png',
        burnDate: now - 70 * day,
        value: 1.2,
      },
    ],
    commissionBranch: [],
  },
];

export function getRadiantById(id: string): Radiant | undefined {
  return mockRadiants.find((r) => r.id === id);
}

export function getTotalBurnValue(radiant: Radiant): number {
  const creationValue = radiant.creationBranch.reduce((sum, nft) => sum + (nft.value || 0), 0);
  const ownerValue = radiant.ownerBranch.reduce((sum, nft) => sum + (nft.value || 0), 0);
  const commissionValue = radiant.commissionBranch.reduce((sum, nft) => sum + (nft.value || 0), 0);
  return creationValue + ownerValue + commissionValue;
}

export function getTotalBurnCount(radiant: Radiant): number {
  return (
    radiant.creationBranch.length +
    radiant.ownerBranch.length +
    radiant.commissionBranch.length
  );
}

export function formatBurnDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
