'use client';

import React from 'react';
import { Tabs } from '@rdna/radiants/components/core';
import { yellowlistCollections } from '@/lib/mockData/yellowlist';
import { TwitterIcon } from '@/components/icons';

// ============================================================================
// Yellowlist Tab Content
// ============================================================================

function YellowlistContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-joystix text-sm text-black mb-2">Permanent Inclusions</h3>
        <p className="font-mondwest text-sm text-content-secondary mb-4">
          These collections will be included in Radiants auctions indefinitely, rest easy knowing that if you don't win this auction, you'll have another opportunity to use them again in the future.
        </p>
      </div>

      {/* Yellowlist Grid */}
      <div className="grid grid-cols-2 gap-3">
        {yellowlistCollections.map((collection) => (
          <div
            key={collection.id}
            className="border border-black bg-cream rounded-sm p-2 flex flex-col gap-2"
          >
            {/* Collection Image */}
            <div className="relative w-full aspect-square border border-black rounded-sm overflow-hidden bg-warm-cloud">
              <img
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Marketplace Links Overlay */}
              <div className="absolute inset-0 bg-edge-muted flex justify-end items-start p-1 gap-1 opacity-0 hover:opacity-100 transition-opacity">
                <a
                  href={collection.tensorLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 border border-black bg-cream rounded flex items-center justify-center hover:bg-sun-yellow transition-colors text-xs"
                  onClick={(e) => e.stopPropagation()}
                  title="View on Tensor"
                >
                  T
                </a>
                <a
                  href={collection.magicEdenLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 border border-black bg-cream rounded flex items-center justify-center hover:bg-sun-yellow transition-colors text-xs"
                  onClick={(e) => e.stopPropagation()}
                  title="View on Magic Eden"
                >
                  M
                </a>
              </div>
            </div>

            {/* Collection Name */}
            <div className="text-center">
              <p className="font-joystix text-xs text-black">{collection.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Prize Information */}
      <div className="border border-black bg-cream rounded-sm p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center text-2xl">🥈</div>
            <p className="font-joystix text-xs text-content-muted">Second Place</p>
            <p className="font-joystix text-sm text-black">$15k</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center text-2xl">🥇</div>
            <p className="font-joystix text-xs text-content-muted">First Place</p>
            <p className="font-joystix text-sm text-black">$25k</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center text-2xl">🥉</div>
            <p className="font-joystix text-xs text-content-muted">Third Place</p>
            <p className="font-joystix text-sm text-black">$10k</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// How to Bid Tab Content
// ============================================================================

function HowToBidContent() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-joystix text-sm text-black mb-2">
          <strong>The Ultimate sacrifice:</strong>
        </h3>
        <p className="font-mondwest text-sm text-content-secondary mb-4">
          At the core of Radiants is a simple binary choice: Do you choose to hold onto things past their prime or allow them to evolve? We've meticulously alchemized the core thesis of on-chain assets into a competitive, engaging, and fair bidding experience wherein prospective bidders offer up their maximum sacrifice to the almighty sunfire. The most valuable sacrifice will be chosen and sent directly to{' '}
          <a
            href="https://sol-incinerator.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline hover:text-sun-yellow"
          >
            The Incinerator
          </a>
          {' '}—where a record of its existence is then etched into the very core of the recently summoned Radiant, ensuring provenance and preserving history.
        </p>
      </div>

      <div>
        <h4 className="font-joystix text-xs text-black mb-2">
          <strong>Key Auction Mechanics:</strong>
        </h4>
        <ul className="space-y-3 font-mondwest text-sm text-content-secondary list-disc list-inside">
          <li>
            <strong>Dutch Auction / Max Bid Model:</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Each user has 24 hours to submit their maximum bid amount for the Radiant they are interested in.</li>
              <li>The system automatically places bids on behalf of the user, starting at the floor price (FP) and increasing by a minimum of 2 SOL to outbid the previous highest bidder.</li>
              <li>The system is designed to keep the bid as low as possible while still maintaining the lead, ensuring efficient use of funds.</li>
            </ul>
          </li>
          <li>
            <strong>Last-Minute Bidding Option:</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Users have the option to "Start bidding with X minutes left," allowing them to join the auction at the last minute for an exciting, fast-paced bidding experience.</li>
              <li>This feature encourages competitive bidding and adds a dynamic element to the auction process.</li>
            </ul>
          </li>
          <li>
            <strong>Bid Burning Mechanism:</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>The winning bid is burned into the winning Radiants NFT, enhancing its value and significance.</li>
              <li>The system then allows losers to claim their losing bids or to use them in the next auction, ensuring that only the winning bid is utilized.</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Earn a Radiant Tab Content
// ============================================================================

function EarnARadiantContent() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-joystix text-sm text-black mb-2">
          <strong>Give a man a fish if he's family.</strong>
        </h3>
        <p className="font-mondwest text-sm text-content-secondary mb-4">
          Per year there will be ~24 awarded Radiants to extraordinary contributors. In the spirit of openness, anyone is able to participate within the Radiants ecosystem, but only Radiants will usher in the untold story. As a contributor you must fill a meaningful gap within or expand our ecosystem. This can include but is not limited to: contributing art and creative assets, developing new products Under the Sun (within our brand umbrella), improving or optimizing established systems, significantly amplifying the success of our initiatives on social media, or even something like creating a Minecraft server for the community.
        </p>
        <p className="font-mondwest text-sm text-content-secondary mb-4">
          If your efforts and output align with our ethos and are valuable to the community and/or founding team, you may be awarded a Radiant to signify your outstanding contributions to the community. The best way to discover where your efforts, curiosities, and talents may serve best is by actively participating in our town halls and keeping an eye on the bounties posted on{' '}
          <a
            href="https://align.nexus/organizations/faf4caa4-73be-4c2a-9a51-543fc382926d/treasury"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline hover:text-sun-yellow font-bold"
          >
            Align
          </a>
          .
        </p>
        <p className="font-mondwest text-sm text-content-secondary mb-4">
          These forums will guide you on the current initiatives and areas of focus that are most crucial to Radiants' growth and success. Supply is low and the backlog for awards at time of writing is ~4-6 months. Waiting to contribute will likely increase this wait time.
        </p>
        <p className="font-mondwest text-sm text-content-secondary">
          Award Radiants will be locked for a year upon award to further align incentives.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

function ArtByRadiantsContent() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-joystix text-sm text-black mb-2">
          <a
            href="https://x.com/kemos4be"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-content-secondary transition-colors"
          >
            <TwitterIcon size={14} className="text-black" />
            Art by KEMOS4BE
          </a>
        </h3>
        <p className="font-mondwest text-sm text-content-secondary">
          All Radiants NFTs are created by KEMOS4BE, featuring unique generative art with retro aesthetics and pixel-art styling.
        </p>
      </div>
    </div>
  );
}

export function AuctionsHelpContent() {
  const tabs = Tabs.useTabsState({ defaultValue: 'about', variant: 'line' });

  return (
    <Tabs.Provider {...tabs}>
    <Tabs.Frame>
      <Tabs.List className="border-b border-black">
        <Tabs.Trigger value="about">
          About
        </Tabs.Trigger>
        <Tabs.Trigger value="yellowlist">
          Yellowlist
        </Tabs.Trigger>
        <Tabs.Trigger value="how-to-bid">
          How to bid
        </Tabs.Trigger>
        <Tabs.Trigger value="earn">
          Earn a radiant
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="about" className="p-4">
        <ArtByRadiantsContent />
      </Tabs.Content>

      <Tabs.Content value="yellowlist" className="p-4">
        <YellowlistContent />
      </Tabs.Content>

      <Tabs.Content value="how-to-bid" className="p-4">
        <HowToBidContent />
      </Tabs.Content>

      <Tabs.Content value="earn" className="p-4">
        <EarnARadiantContent />
      </Tabs.Content>
    </Tabs.Frame>
    </Tabs.Provider>
  );
}

export default AuctionsHelpContent;
