// Mock commission data for the Radiants Studio commission marketplace

export interface Commission {
  id: string;
  radiantId: string;
  radiantName: string;
  radiantImage: string;
  title: string;
  description: string;
  reward: number; // ETH
  deadline: number; // timestamp
  status: 'open' | 'in_progress' | 'completed' | 'expired';
  submissionsCount: number;
  requester: string;
  requirements?: string[];
}

export interface CommissionSubmission {
  id: string;
  commissionId: string;
  artist: string;
  image: string;
  description: string;
  submittedAt: number;
  status: 'pending' | 'accepted' | 'rejected';
}

// Helper for timestamps
const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const mockCommissions: Commission[] = [
  {
    id: 'comm-req-1',
    radiantId: 'radiant-42',
    radiantName: 'Radiant #42 - Golden Dawn',
    radiantImage: '/assets/nfts/radiant-42.png',
    title: 'Golden Sunrise Scene',
    description: 'Create a pixel art scene featuring Radiant #42 watching a golden sunrise. Must incorporate the sun motif and use only the RadOS color palette.',
    reward: 0.5,
    deadline: now + 7 * day,
    status: 'open',
    submissionsCount: 3,
    requester: '0x1234...5678',
    requirements: [
      'Use only cream, black, and sun-yellow colors',
      '32x32 pixel canvas',
      'Include Radiant #42 character',
      'Sunrise/sun theme required',
    ],
  },
  {
    id: 'comm-req-2',
    radiantId: 'radiant-41',
    radiantName: 'Radiant #41 - Pixel Storm',
    radiantImage: '/assets/nfts/radiant-41.png',
    title: 'Digital Rain Animation',
    description: 'Design a single frame for a digital rain effect that complements the Pixel Storm aesthetic. This will be used in the Murder Tree display.',
    reward: 0.8,
    deadline: now + 14 * day,
    status: 'open',
    submissionsCount: 1,
    requester: '0xABCD...EF01',
    requirements: [
      'Matrix/digital rain theme',
      'Glitch effects welcome',
      '32x32 or 64x64 canvas',
    ],
  },
  {
    id: 'comm-req-3',
    radiantId: 'radiant-40',
    radiantName: 'Radiant #40 - Cosmic Voyager',
    radiantImage: '/assets/nfts/radiant-40.png',
    title: 'Space Explorer Portrait',
    description: 'A detailed portrait of Radiant #40 in their space helmet, with stars reflected in the visor.',
    reward: 1.2,
    deadline: now + 5 * day,
    status: 'in_progress',
    submissionsCount: 5,
    requester: '0x9876...5432',
    requirements: [
      'Portrait orientation',
      'Space theme',
      'Reflection details in helmet',
    ],
  },
  {
    id: 'comm-req-4',
    radiantId: 'radiant-42',
    radiantName: 'Radiant #42 - Golden Dawn',
    radiantImage: '/assets/nfts/radiant-42.png',
    title: 'Crown of Flames',
    description: 'Reimagine the crown accessory as a crown of golden flames. Focus on the dynamic movement of fire.',
    reward: 0.3,
    deadline: now - 2 * day,
    status: 'completed',
    submissionsCount: 8,
    requester: '0x1234...5678',
    requirements: [
      'Fire/flame animation frames',
      'Crown focus',
    ],
  },
  {
    id: 'comm-req-5',
    radiantId: 'radiant-41',
    radiantName: 'Radiant #41 - Pixel Storm',
    radiantImage: '/assets/nfts/radiant-41.png',
    title: 'Glitch Portrait Series',
    description: 'Create a series of 3 glitched versions of Radiant #41, each progressively more corrupted.',
    reward: 1.5,
    deadline: now + 21 * day,
    status: 'open',
    submissionsCount: 0,
    requester: '0xABCD...EF01',
    requirements: [
      '3 frames required',
      'Progressive glitch effect',
      'VHS/CRT aesthetic',
    ],
  },
];

export const mockCommissionSubmissions: CommissionSubmission[] = [
  {
    id: 'cs-1',
    commissionId: 'comm-req-1',
    artist: '0x5555...6666',
    image: '/assets/submissions/sunrise-1.png',
    description: 'Golden rays breaking through pixel clouds.',
    submittedAt: now - 2 * day,
    status: 'pending',
  },
  {
    id: 'cs-2',
    commissionId: 'comm-req-1',
    artist: '0x7777...8888',
    image: '/assets/submissions/sunrise-2.png',
    description: 'Radiant #42 meditating at dawn.',
    submittedAt: now - 1 * day,
    status: 'pending',
  },
  {
    id: 'cs-3',
    commissionId: 'comm-req-3',
    artist: '0x9999...0000',
    image: '/assets/submissions/space-1.png',
    description: 'Cosmic reflections in the void.',
    submittedAt: now - 3 * day,
    status: 'pending',
  },
];

export function getOpenCommissions(): Commission[] {
  return mockCommissions.filter((c) => c.status === 'open');
}

export function getCommissionsByRadiant(radiantId: string): Commission[] {
  return mockCommissions.filter((c) => c.radiantId === radiantId);
}

export function getCommissionSubmissions(commissionId: string): CommissionSubmission[] {
  return mockCommissionSubmissions.filter((s) => s.commissionId === commissionId);
}

export function formatDeadline(timestamp: number): string {
  const diff = timestamp - Date.now();
  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / day);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  return `${hours} hour${hours > 1 ? 's' : ''} left`;
}

export function getCommissionStatusColor(status: Commission['status']): string {
  switch (status) {
    case 'open':
      return 'bg-green text-primary';
    case 'in_progress':
      return 'bg-sun-yellow text-primary';
    case 'completed':
      return 'bg-sky-blue text-primary';
    case 'expired':
      return 'bg-primary/20 text-primary/60';
  }
}
