// Mock studio submissions for voting system

export interface StudioSubmission {
  id: string;
  name: string;
  description: string;
  image: string; // Base64 data URL or placeholder
  creator: string;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  createdAt: number;
}

// Helper for timestamps
const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

// Generate a simple placeholder pixel art as data URL
function generatePlaceholderPixelArt(seed: number): string {
  // Return a placeholder - in real app this would be actual pixel art
  const colors = ['#1A1A1A', '#F5F0E6', '#FFD93D'];
  const color = colors[seed % colors.length];
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect fill="${color}" width="32" height="32"/>
      <rect fill="#1A1A1A" x="8" y="8" width="16" height="16"/>
      <rect fill="#F5F0E6" x="12" y="12" width="8" height="8"/>
    </svg>
  `)}`;
}

export const mockSubmissions: StudioSubmission[] = [
  {
    id: 'sub-1',
    name: 'Golden Sun Rising',
    description: 'A tribute to the RadOS sun, rendered in pure pixels.',
    image: generatePlaceholderPixelArt(1),
    creator: '0x1234...5678',
    upvotes: 156,
    downvotes: 12,
    netVotes: 144,
    createdAt: now - 2 * day,
  },
  {
    id: 'sub-2',
    name: 'Pixel Punk',
    description: 'Cyberpunk-inspired character in the RadOS style.',
    image: generatePlaceholderPixelArt(2),
    creator: '0xABCD...EF01',
    upvotes: 89,
    downvotes: 8,
    netVotes: 81,
    createdAt: now - 3 * day,
  },
  {
    id: 'sub-3',
    name: 'Retro Desktop',
    description: 'A nostalgic take on classic OS interfaces.',
    image: generatePlaceholderPixelArt(3),
    creator: '0x9999...0000',
    upvotes: 234,
    downvotes: 45,
    netVotes: 189,
    createdAt: now - 1 * day,
  },
  {
    id: 'sub-4',
    name: 'Murder Tree Sprout',
    description: 'The beginning of every murder tree journey.',
    image: generatePlaceholderPixelArt(4),
    creator: '0x5555...6666',
    upvotes: 67,
    downvotes: 23,
    netVotes: 44,
    createdAt: now - 5 * day,
  },
  {
    id: 'sub-5',
    name: 'Dithered Dreams',
    description: 'Exploring the beauty of Bayer matrix dithering.',
    image: generatePlaceholderPixelArt(5),
    creator: '0x7777...8888',
    upvotes: 112,
    downvotes: 15,
    netVotes: 97,
    createdAt: now - 4 * day,
  },
  {
    id: 'sub-6',
    name: 'Radiant Portrait',
    description: 'Character study of Radiant #42.',
    image: generatePlaceholderPixelArt(6),
    creator: '0x1234...5678',
    upvotes: 45,
    downvotes: 5,
    netVotes: 40,
    createdAt: now - 6 * day,
  },
  {
    id: 'sub-7',
    name: 'Neon Grid',
    description: 'Synthwave meets pixel art.',
    image: generatePlaceholderPixelArt(7),
    creator: '0xAAAA...BBBB',
    upvotes: 178,
    downvotes: 22,
    netVotes: 156,
    createdAt: now - 12 * hour,
  },
  {
    id: 'sub-8',
    name: 'Pixel Clouds',
    description: 'Serene cloudscape in 3 colors.',
    image: generatePlaceholderPixelArt(8),
    creator: '0xCCCC...DDDD',
    upvotes: 91,
    downvotes: 18,
    netVotes: 73,
    createdAt: now - 7 * day,
  },
  {
    id: 'sub-9',
    name: 'Binary Sunset',
    description: 'Where digital meets organic.',
    image: generatePlaceholderPixelArt(9),
    creator: '0xEEEE...FFFF',
    upvotes: 203,
    downvotes: 31,
    netVotes: 172,
    createdAt: now - 8 * hour,
  },
  {
    id: 'sub-10',
    name: 'The Auction House',
    description: 'Architectural study of a pixel marketplace.',
    image: generatePlaceholderPixelArt(10),
    creator: '0x2222...3333',
    upvotes: 56,
    downvotes: 9,
    netVotes: 47,
    createdAt: now - 10 * day,
  },
];

export function getSubmissionsSortedByVotes(): StudioSubmission[] {
  return [...mockSubmissions].sort((a, b) => b.netVotes - a.netVotes);
}

export function getSubmissionsSortedByDate(): StudioSubmission[] {
  return [...mockSubmissions].sort((a, b) => b.createdAt - a.createdAt);
}

export function getRandomSubmission(exclude?: string[]): StudioSubmission | null {
  const available = mockSubmissions.filter(
    (s) => !exclude?.includes(s.id)
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function formatCreatedAt(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / hour);
  const days = Math.floor(diff / day);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}
