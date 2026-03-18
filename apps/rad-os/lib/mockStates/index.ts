import type { MockStateDefinition, MockStateCategory } from '@rdna/radiants/components/core';

export interface AppMockStatesConfig {
  definitions: MockStateDefinition[];
  categories?: MockStateCategory[];
}

const MOCK_STATES_BY_APP: Record<string, AppMockStatesConfig> = {};

export function getAppMockStates(appId: string): AppMockStatesConfig | undefined {
  return MOCK_STATES_BY_APP[appId];
}
