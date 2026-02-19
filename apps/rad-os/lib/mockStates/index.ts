import type { MockStateDefinition, MockStateCategory } from '@rdna/radiants/components/core';
import { AUCTIONS_MOCK_STATE_DEFINITIONS } from './auctionsMockStates';
import {
  SEEKER_MOCK_STATE_DEFINITIONS,
  SEEKER_MOCK_STATE_CATEGORIES,
} from './seekerMockStates';

export interface AppMockStatesConfig {
  definitions: MockStateDefinition[];
  categories?: MockStateCategory[];
}

const MOCK_STATES_BY_APP: Record<string, AppMockStatesConfig> = {
  auctions: {
    definitions: AUCTIONS_MOCK_STATE_DEFINITIONS,
  },
  seeker: {
    definitions: SEEKER_MOCK_STATE_DEFINITIONS,
    categories: SEEKER_MOCK_STATE_CATEGORIES,
  },
};

export function getAppMockStates(appId: string): AppMockStatesConfig | undefined {
  return MOCK_STATES_BY_APP[appId];
}
