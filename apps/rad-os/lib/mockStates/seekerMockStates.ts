import type { MockStateDefinition, MockStateCategory } from '@rdna/radiants/components/core';

export const SEEKER_MOCK_STATE_CATEGORIES: MockStateCategory[] = [
  { id: 'wallet', label: 'Wallet' },
];

export const SEEKER_MOCK_STATE_DEFINITIONS: MockStateDefinition[] = [
  {
    id: 'wallet-disconnected',
    name: 'Disconnected',
    description: 'No wallet connected',
    category: 'wallet',
    icon: '🔌',
  },
  {
    id: 'wallet-connected-no-radiants',
    name: 'Connected (No NFT)',
    description: 'Wallet connected, no Radiants owned',
    category: 'wallet',
    icon: '👛',
  },
  {
    id: 'radiant-holder',
    name: 'Radiant Holder',
    description: 'Wallet connected with Radiants — full chat access',
    category: 'wallet',
    icon: '🌟',
  },
];
