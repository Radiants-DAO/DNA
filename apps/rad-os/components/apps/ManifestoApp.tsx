'use client';

import React from 'react';
import { Tabs, useTabsState } from '@rdna/radiants/components/core';
import { AppProps } from '@/lib/constants';

// ============================================================================
// Data
// ============================================================================

const SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: `Welcome to Radiants.

We are a collective of creators, builders, and dreamers united by a singular vision: to forge a new frontier of digital ownership and community-driven art.

In a world of fleeting attention and disposable content, we believe in the power of permanence. We believe that art should be more than pixels on a screen—it should be a living, breathing testament to the creativity of its makers and the passion of its collectors.`,
  },
  {
    id: 'vision',
    title: 'Our Vision',
    content: `We envision a world where digital art carries the weight and significance of its physical counterparts.

Where every piece tells a story not just of its creation, but of its journey—the hands it has passed through, the communities it has touched, the moments it has witnessed.

Radiants are not just NFTs. They are beacons of light in the digital cosmos, each one carrying within it the accumulated energy of every sacrifice made in its name.`,
  },
  {
    id: 'values',
    title: 'Core Values',
    content: `Permanence over ephemera.
Community over isolation.
Creation over consumption.
Quality over quantity.

We believe that true value is built through sacrifice and commitment. The Murder Tree stands as a monument to this belief—a living archive of offerings made by those who sought to claim a Radiant.

Each branch tells a story. Each leaf represents a choice. And at the heart of it all, the Radiant shines brighter with every contribution.`,
  },
  {
    id: 'community',
    title: 'Community',
    content: `We are more than holders. We are stewards.

Every Radiant owner becomes a curator of their own branch of the Murder Tree. They can commission art, accept tributes, and shape the legacy of their piece.

This is collaborative ownership—a model where the boundaries between creator and collector blur, where every participant becomes an active author in an ever-expanding narrative.

Join us. Become a Radiant.`,
  },
  {
    id: 'future',
    title: 'The Future',
    content: `This is only the beginning.

As our community grows, so too will the ecosystem around it. New tools for creation. New ways to collaborate. New branches on the Murder Tree waiting to be grown.

We don't know exactly what the future holds, but we know one thing for certain: it will be built by all of us, together.

The sun rises on a new era of digital ownership.
Welcome to Radiants.`,
  },
];

// ============================================================================
// Component
// ============================================================================

export function ManifestoApp({ windowId }: AppProps) {
  const tabs = useTabsState({ defaultValue: 'introduction', layout: 'sidebar' });

  return (
    <div className="h-full flex flex-col px-2 pb-2">
      <Tabs.Provider {...tabs}>
        <Tabs.List>
          {SECTIONS.map((s) => (
            <Tabs.Trigger key={s.id} value={s.id}>
              {s.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {SECTIONS.map((section) => (
          <Tabs.Content key={section.id} value={section.id}>
            <div className="max-w-[42rem] mx-auto p-4">
              <h2 className="mb-4">{section.title}</h2>
              <div className="font-mondwest text-base text-content-secondary leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Provider>
    </div>
  );
}

export default ManifestoApp;
