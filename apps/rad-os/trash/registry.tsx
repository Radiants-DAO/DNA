/**
 * Trash Registry
 *
 * Trashed apps still exist and can be opened from the Trash app.
 * Their source lives in trash/apps/ and is excluded from LLM context
 * via .claudeignore, but lazy imports here keep them functional.
 *
 * To trash an app:
 * 1. Move its source to trash/apps/<AppName>/
 * 2. Add an entry here with the lazy import and metadata
 * 3. Remove it from APP_IDS and APP_REGISTRY in constants.tsx
 * 4. Remove its StartMenu entry and desktop icon references
 */

import React from 'react';
import type { AppConfig } from '@/lib/constants';

// Trashed app IDs
export const TRASH_APP_IDS = {
  // Example:
  // AUCTIONS: 'trash-auctions',
} as const;

// Trashed app configs — merged into APP_REGISTRY
export const TRASH_REGISTRY: Record<string, AppConfig> = {
  // Example of a trashed app:
  //
  // [TRASH_APP_IDS.AUCTIONS]: {
  //   id: TRASH_APP_IDS.AUCTIONS,
  //   title: 'Auctions',
  //   icon: <Icon name="coins" size={20} />,
  //   component: lazy(() => import('@/trash/apps/AuctionsApp')),
  //   resizable: true,
  //   trashed: true,
  //   trashedDate: '2026-03-06',
  // },
};
