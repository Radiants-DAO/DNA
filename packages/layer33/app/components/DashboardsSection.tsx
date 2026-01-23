'use client';

import { useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { DashboardListItem } from './DashboardListItem';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons';

// Grid icon SVG - defined outside component to avoid recreation on each render
const GridIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="9" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="1" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

// List icon SVG - defined outside component to avoid recreation on each render
const ListIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="2" width="14" height="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="1" y="7" width="14" height="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="1" y="12" width="14" height="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

type Category = 'network' | 'revenue' | 'governance';

interface Dashboard {
  name: string;
  url: string;
  author: string;
  description: string;
  isLayer33: boolean;
  categories: Category[];
}

const layer33Dashboards: Dashboard[] = [
  {
    name: 'Validator Profit Estimator',
    url: 'https://validator-profit-estimator.trillium.so',
    author: '@TrilliumJohn',
    description: 'Profit calculator with SIMD-0411 inflation change toggle to model future validator economics',
    isLayer33: true,
    categories: ['revenue'],
  },
  {
    name: 'SPEX',
    url: 'https://spex.stakingfacilities.com',
    author: '@StakingMatthias',
    description: 'Validator performance metrics and monitoring for Solana',
    isLayer33: true,
    categories: ['network', 'revenue'],
  },
  {
    name: 'Stake Inspector',
    url: 'https://www.stakeinspector.com',
    author: '@maxh2onodes',
    description: 'Validator stake account analysis.',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'DoubleZero Fees',
    url: 'https://dz-fees.stakingfacilities.com',
    author: '@StakingMatthias',
    description: 'Fee structure for DoubleZero validators',
    isLayer33: true,
    categories: ['revenue'],
  },
  {
    name: 'SIMD Votes',
    url: 'https://simd-votes.stakingfacilities.com',
    author: '@StakingMatthias',
    description: 'Solana Improvement Document (SIMD) voting history',
    isLayer33: true,
    categories: ['governance'],
  },
  {
    name: 'SolSharing',
    url: 'https://www.solsharing.com',
    author: '@maxh2onodes',
    description: 'Track validators sharing priority fees with their stakers, via Jito\'s Tip Router',
    isLayer33: true,
    categories: ['revenue'],
  },
  {
    name: 'Wen Firedancer',
    url: 'https://www.wenfiredancer.com',
    author: '@maxh2onodes',
    description: 'Tracking Firedancer client adoption',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Solana Constitution',
    url: 'https://www.solanaconstitution.com',
    author: '@maxh2onodes',
    description: 'Tracking the drafting of the Solana governance constitution document.',
    isLayer33: true,
    categories: ['governance'],
  },
  {
    name: 'Pine Stake Profit Calculator',
    url: 'https://www.pinestake.com/en/profit-calculator',
    author: '@PineStake',
    description: 'Validator profitability and returns calculator',
    isLayer33: true,
    categories: ['revenue'],
  },
  {
    name: 'Pine Stake Pools',
    url: 'https://www.pinestake.com/en/pools',
    author: '@PineStake',
    description: 'Stake pool performance metrics',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Pine Stake Testnet Faucet',
    url: 'https://www.pinestake.com/pt/testnet-faucet',
    author: '@PineStake',
    description: 'Testnet SOL token faucet',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Rugalert',
    url: 'https://rugalert.pumpkinspool.com',
    author: '@pumpkinspool',
    description: 'Alerting of validators raising their commissions',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Validator Tracker',
    url: 'https://rugalert.pumpkinspool.com/validators',
    author: '@pumpkinspool',
    description: 'Track and monitor Solana validators',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Testnet Faucet',
    url: 'https://www.testnetfaucet.org',
    author: '@ferric',
    description: 'Free testnet SOL tokens for testing and development',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Devnet Faucet',
    url: 'https://www.devnetfaucet.org',
    author: '@ferric',
    description: 'Free devnet SOL tokens for development',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Solana Hardware Compatibility List',
    url: 'https://solanahcl.org',
    author: '@ferric',
    description: 'Hardware compatibility testing and recommendations for Solana validators',
    isLayer33: true,
    categories: ['network'],
  },
  {
    name: 'Validator Automatic Failover',
    url: 'https://github.com/schmiatz/solana-validator-automatic-failover',
    author: '@StakingMatthias',
    description: 'Client for automatic failovering at either delinquency or a certain vote latency threshold',
    isLayer33: true,
    categories: ['network'],
  },
];

const communityDashboards: Dashboard[] = [
  {
    name: 'SolCalc',
    url: 'https://solcalc.vercel.app',
    author: '@meyerbro',
    description: 'Calculator that factors in pay-to-stake pools including Marinade, DoubleZero, and Jito',
    isLayer33: false,
    categories: ['revenue'],
  },
  {
    name: 'Marinade SAM Costs',
    url: 'https://marisam.vercel.app',
    author: '@meyerbro',
    description: 'Cost analysis for Marinade Stake Auction Marketplace (SAM)',
    isLayer33: false,
    categories: ['revenue'],
  },
  {
    name: 'Solana Climate',
    url: 'https://climate.solana.com',
    author: '@solana',
    description: 'Power and CO2 emissions estimation for Solana',
    isLayer33: false,
    categories: ['network'],
  },
  {
    name: 'Solana Compass',
    url: 'https://solanacompass.com/statistics/decentralization',
    author: '@SolanaCompass',
    description: 'Stake distribution and network decentralization metrics',
    isLayer33: false,
    categories: ['network'],
  },
  {
    name: 'Solscan Analytics',
    url: 'https://solscan.io/analytics',
    author: '@solscanofficial',
    description: 'Charts and analytics for Solana',
    isLayer33: false,
    categories: ['network'],
  },
  {
    name: 'Solfees',
    url: 'https://www.solfees.fyi',
    author: '@ronnyhaase',
    description: 'Solana transaction fee calculator',
    isLayer33: false,
    categories: ['revenue'],
  },
  {
    name: 'Jito Explorer',
    url: 'https://explorer.jito.wtf',
    author: '@jito_sol',
    description: 'Block explorer for Jito MEV transactions and bundles',
    isLayer33: false,
    categories: ['revenue'],
  },
  {
    name: 'ValidBlocks SVP',
    url: 'https://validblocks.com/svp.html',
    author: '@ValidBlocks',
    description: 'Solana validator profitability',
    isLayer33: false,
    categories: ['revenue'],
  },
  {
    name: 'Solana Advisor',
    url: 'https://pools-adviser.lumlabs.io',
    author: '@lumlabs',
    description: 'Turn pools\' rules into clear strategy and real outcomes, from plan to execution.',
    isLayer33: false,
    categories: ['revenue'],
  },
  {
    name: 'ParaFi Network Stats',
    url: 'https://parafi.tech/solana/network-stats',
    author: '@parafitech',
    description: 'Real-time Solana metrics: block times, TPS, compute units, validator counts, and tokenomics',
    isLayer33: false,
    categories: ['network'],
  },
];

export function DashboardsSection() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isCommunityExpanded, setIsCommunityExpanded] = useState(false);

  const filteredLayer33 =
    selectedCategory === 'all'
      ? layer33Dashboards
      : layer33Dashboards.filter((d) => d.categories.includes(selectedCategory));

  const filteredCommunity =
    selectedCategory === 'all'
      ? communityDashboards
      : communityDashboards.filter((d) => d.categories.includes(selectedCategory));

  return (
    <section id="dashboards" className="py-16 md:py-24 bg-white">
      <div className="page-padding">
        <div className="w-full max-w-[77rem] mx-auto">
          <header className="text-center mb-12">
            <h2 className="mb-4">Our Tooling</h2>
            <p className="text-lg text-black max-w-3xl mx-auto mb-6">
              Layer33 members have already built and open-sourced infrastructure, tooling, and dashboards used by
              validators, stakers, and Solana builders today. This includes monitoring, routing, education, and
              operational tools designed to reduce costs and improve performance for independent operators.
            </p>
            <p className="text-lg text-black max-w-3xl mx-auto mb-6">
              If something is missing, we want to hear it. Layer33 exists to serve the broader Solana ecosystem.
            </p>
            <div className="mb-6">
              <a
                href="https://validators.layer33.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase hover:text-neutral-neutral-4 transition-colors"
              >
                Who is part of Layer33?
              </a>
            </div>
            <a
              href="https://x.com/Layer_33_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm uppercase hover:text-neutral-neutral-4 transition-colors"
            >
              <span>Join the conversation on</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </header>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'secondary' : 'outline'}
                size="md"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === 'network' ? 'secondary' : 'outline'}
                size="md"
                onClick={() => setSelectedCategory('network')}
              >
                Network
              </Button>
              <Button
                variant={selectedCategory === 'revenue' ? 'secondary' : 'outline'}
                size="md"
                onClick={() => setSelectedCategory('revenue')}
              >
                Revenue
              </Button>
              <Button
                variant={selectedCategory === 'governance' ? 'secondary' : 'outline'}
                size="md"
                onClick={() => setSelectedCategory('governance')}
              >
                Governance
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                href="https://docs.google.com/forms/d/e/1FAIpQLSfaPd_EH26daqkC4bCKUoP_2n7f47T-eCy3PtXpMCb7xAYbaQ/viewform"
                target="_blank"
                asLink={false}
              >
                Submit a Dashboard
              </Button>
              <div className="inline-flex border border-black p-1 gap-1 bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="md"
                  onClick={() => setViewMode('grid')}
                  className="gap-2"
                >
                  <GridIcon size={16} />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="md"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <ListIcon size={16} />
                  List
                </Button>
              </div>
            </div>
          </div>

          {filteredLayer33.length > 0 && (
            <div className="mb-16">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLayer33.map((dashboard) => (
                    <DashboardCard key={dashboard.url} {...dashboard} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLayer33.map((dashboard) => (
                    <DashboardListItem key={dashboard.url} {...dashboard} />
                  ))}
                </div>
              )}
            </div>
          )}

          {filteredCommunity.length > 0 && (
            <div>
              <button
                onClick={() => setIsCommunityExpanded(!isCommunityExpanded)}
                className="flex items-center justify-between w-full text-2xl font-bold mb-6 hover:opacity-70 transition-opacity uppercase"
              >
                <span>Other Community Dashboards</span>
                <Icon
                  name="chevron-down"
                  size={24}
                  className={`transition-transform duration-300 ${isCommunityExpanded ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>
              {isCommunityExpanded && (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCommunity.map((dashboard) => (
                        <DashboardCard key={dashboard.url} {...dashboard} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCommunity.map((dashboard) => (
                        <DashboardListItem key={dashboard.url} {...dashboard} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {filteredLayer33.length === 0 && filteredCommunity.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-neutral-3 text-lg uppercase">No dashboards found for this category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
