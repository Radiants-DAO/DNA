'use client';

import React from 'react';
import { Card } from '@rdna/radiants/components/core';
import { WindowContent } from '@/components/Rad_os';
import { AppProps } from '@/lib/constants';

// ============================================================================
// Data
// ============================================================================

interface LinkItem {
  name: string;
  description: string;
  url: string;
}

interface LinkCategory {
  title: string;
  links: LinkItem[];
}

const LINK_CATEGORIES: LinkCategory[] = [
  {
    title: 'Socials',
    links: [
      {
        name: 'Twitter',
        description: 'Follow us for updates and announcements',
        url: 'https://twitter.com/radiants',
      },
      {
        name: 'Discord',
        description: 'Join our community and chat with holders',
        url: 'https://discord.gg/radiants',
      },
      {
        name: 'Instagram',
        description: 'Behind the scenes and art highlights',
        url: 'https://instagram.com/radiants',
      },
    ],
  },
  {
    title: 'Resources',
    links: [
      {
        name: 'Documentation',
        description: 'Learn about the Radiants ecosystem',
        url: 'https://docs.radiants.xyz',
      },
      {
        name: 'Blog',
        description: 'Long-form updates and deep dives',
        url: 'https://blog.radiants.xyz',
      },
      {
        name: 'FAQ',
        description: 'Frequently asked questions',
        url: 'https://radiants.xyz/faq',
      },
    ],
  },
  {
    title: 'Marketplaces',
    links: [
      {
        name: 'OpenSea',
        description: 'Buy and sell Radiants',
        url: 'https://opensea.io/collection/radiants',
      },
      {
        name: 'Blur',
        description: 'Trade on Blur marketplace',
        url: 'https://blur.io/collection/radiants',
      },
      {
        name: 'LooksRare',
        description: 'Explore on LooksRare',
        url: 'https://looksrare.org/collections/radiants',
      },
    ],
  },
  {
    title: 'Tools',
    links: [
      {
        name: 'Etherscan',
        description: 'View contract on Etherscan',
        url: 'https://etherscan.io/address/0x...',
      },
      {
        name: 'GitHub',
        description: 'Open source repositories',
        url: 'https://github.com/radiants',
      },
      {
        name: 'Dune Analytics',
        description: 'On-chain data and dashboards',
        url: 'https://dune.com/radiants',
      },
    ],
  },
];

// ============================================================================
// Component
// ============================================================================

function LinkCard({ link }: { link: LinkItem }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        block p-4
        border border-edge-muted rounded-sm
        bg-surface-muted
        hover:bg-sun-yellow/20 hover:border-edge-muted
        active:bg-sun-yellow/30
        transition-colors
        group
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-joystix text-xs text-content-primary group-hover:text-content-primary">
            {link.name}
          </h3>
          <p className="font-mondwest text-xs text-content-muted mt-1">
            {link.description}
          </p>
        </div>
        {/* External link icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className="text-content-muted group-hover:text-content-muted shrink-0 mt-1"
        >
          <path d="M10.5 10.5H1.5V1.5H6V0H1.5C0.675 0 0 0.675 0 1.5V10.5C0 11.325 0.675 12 1.5 12H10.5C11.325 12 12 11.325 12 10.5V6H10.5V10.5ZM7.5 0V1.5H9.44L3.09 7.85L4.15 8.91L10.5 2.56V4.5H12V0H7.5Z" />
        </svg>
      </div>
    </a>
  );
}

export function LinksApp({ windowId }: AppProps) {
  return (
    <WindowContent>
      <div className="max-w-[36rem] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-joystix text-lg text-content-primary mb-1">Links</h1>
          <p className="font-mondwest text-sm text-content-muted">
            All links open in a new tab
          </p>
        </div>

        {/* Categories */}
        {LINK_CATEGORIES.map((category) => (
          <section key={category.title}>
            <h2 className="font-joystix text-xs text-content-muted uppercase mb-3">
              {category.title}
            </h2>
            <div className="space-y-2">
              {category.links.map((link) => (
                <LinkCard key={link.name} link={link} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </WindowContent>
  );
}

export default LinksApp;
