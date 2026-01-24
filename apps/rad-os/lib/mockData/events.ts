// Mock events data for the Calendar app

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  type: 'auction' | 'drop' | 'community' | 'announcement';
  link?: string;
}

export const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Radiant #42 Auction',
    description: 'The legendary golden Radiant goes up for auction. Reserve price: 10 ETH.',
    date: '2025-02-15T18:00:00Z',
    type: 'auction',
    link: '#auctions',
  },
  {
    id: 'event-2',
    title: 'Community Art Drop',
    description: 'Weekly pixel art submissions showcase. Top 3 get featured on the homepage.',
    date: '2025-02-10T20:00:00Z',
    type: 'drop',
  },
  {
    id: 'event-3',
    title: 'Discord AMA Session',
    description: 'Q&A with the founding team. Bring your questions about the roadmap!',
    date: '2025-02-08T19:00:00Z',
    type: 'community',
    link: 'https://discord.gg/radiants',
  },
  {
    id: 'event-4',
    title: 'Murder Tree Update v2.0',
    description: 'New branch visualization and improved performance rolling out.',
    date: '2025-02-20T00:00:00Z',
    type: 'announcement',
  },
  {
    id: 'event-5',
    title: 'Radiant Commission Wave',
    description: 'New commission slots open for Radiants #40-50. Artists prepare your portfolios!',
    date: '2025-02-25T16:00:00Z',
    type: 'auction',
  },
  {
    id: 'event-6',
    title: 'Pixel Art Workshop',
    description: 'Learn dithering techniques with master pixel artist RetroKing.',
    date: '2025-02-12T21:00:00Z',
    type: 'community',
  },
  {
    id: 'event-7',
    title: 'Radiant #43 Reveal',
    description: 'The newest Radiant enters the collection. What will its murder tree become?',
    date: '2025-03-01T18:00:00Z',
    type: 'drop',
  },
  {
    id: 'event-8',
    title: 'Studio Update: Dither Tool',
    description: 'New dithering algorithms and export options now available in Radiants Studio.',
    date: '2025-02-05T00:00:00Z',
    type: 'announcement',
  },
];

export const eventTypeColors: Record<CalendarEvent['type'], string> = {
  auction: 'bg-sun-yellow text-primary',
  drop: 'bg-sky-blue text-white',
  community: 'bg-primary text-cream',
  announcement: 'bg-highlight-pink text-primary',
};

export const eventTypeLabels: Record<CalendarEvent['type'], string> = {
  auction: 'Auction',
  drop: 'Drop',
  community: 'Community',
  announcement: 'News',
};
