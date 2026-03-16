'use client';

import Image from 'next/image';
import type { NewsItem } from '../types';

const FEED: NewsItem[] = [
  {
    id: '1',
    type: 'drop',
    title: 'Radiant 028 Live * Murder Tree Update * Community AMA',
    body: 'The latest Radiant has emerged from the sun. Traits revealed at noon UTC.',
    timestamp: 'FEB 19',
    thumbnail: '/assets/radiants/radiant-003.avif',
  },
  {
    id: '2',
    type: 'event',
    title: 'Seeker Pre-Order * Solana Mobile Chapter 2 * Early Access',
    body: 'Radiants holders get priority access to Seeker device pre-orders.',
    timestamp: 'FEB 17',
    thumbnail: '/assets/radiants/radiant-001.avif',
  },
  {
    id: '3',
    type: 'community',
    title: 'KEMOSABE 10-7 Sessions * New Tracks * Rad Radio Exclusive',
    body: 'Three new tracks from KEMOSABE added to Rad Radio.',
    timestamp: 'FEB 15',
    thumbnail: '/assets/images/Cowboy-Profile-from-Midjourney_1.avif',
  },
  {
    id: '4',
    type: 'update',
    title: 'RadOS v2 Launch * Desktop Overhaul * DevTools Integration',
    body: 'The new RadOS desktop brings a complete UI refresh with developer tools.',
    timestamp: 'FEB 12',
    thumbnail: '/assets/radiants/radiant-002.avif',
  },
  {
    id: '5',
    type: 'drop',
    title: 'Auction House Open * Bid on Rare Radiants * Vault System',
    body: 'The auction house is now live. Use your vault to bid on rare Radiants.',
    timestamp: 'FEB 10',
    thumbnail: '/assets/radiants/radNS6bJAkGw5UyopgbuBo64hwueoSEXMQNgmupuY5j.png',
  },
  {
    id: '6',
    type: 'community',
    title: 'Dither Camera Beta * Canvas Filters * Radiant Portraits',
    body: 'The new dither camera lets you create Radiant-style portraits.',
    timestamp: 'FEB 8',
    thumbnail: '/assets/images/Kemos-4be-Cowboy-v7_1.avif',
  },
  {
    id: '7',
    type: 'event',
    title: 'Brand Assets Update * New Logos * Style Guide Refresh',
    body: 'Updated brand assets are now available in the Brand Assets app.',
    timestamp: 'FEB 5',
    thumbnail: '/assets/radiants/radM6Bwk72mN2gp5Qs3U8my6sSc9aTpJAJC3hRCo53z.png',
  },
];

export function InfoTab() {
  return (
    <div className="h-full overflow-y-auto">
      {FEED.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 px-4 py-3 border-b border-rule"
        >
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs text-mute uppercase tracking-wider">
              {item.timestamp}
            </span>
            <p className="mt-0.5">
              {item.title}
            </p>
          </div>
          {item.thumbnail && (
            <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-depth">
              <Image
                src={item.thumbnail}
                alt=""
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
