import React, { ReactNode, ComponentType, lazy } from 'react';
import {
  RadMarkIcon,
  Icon,
} from '@/components/icons';
import { AuctionsHelpContent } from '@/components/apps/AuctionsApp/AuctionsHelpContent';

// Lazy load all apps for better initial load performance
const BrandAssetsApp = lazy(() => import('@/components/apps/BrandAssetsApp'));
const ManifestoApp = lazy(() => import('@/components/apps/ManifestoApp'));
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const LinksApp = lazy(() => import('@/components/apps/LinksApp'));
const SettingsApp = lazy(() => import('@/components/apps/SettingsApp'));
const CalendarApp = lazy(() => import('@/components/apps/CalendarApp'));
const RadRadioApp = lazy(() => import('@/components/apps/RadRadioApp'));
const RadiantsStudioApp = lazy(() => import('@/components/apps/RadiantsStudioApp'));
const MurderTreeApp = lazy(() => import('@/components/apps/MurderTreeApp'));
const AuctionsApp = lazy(() => import('@/components/apps/AuctionsApp'));
const SeekerApp = lazy(() => import('@/components/apps/SeekerApp'));

// App IDs as const for type safety
export const APP_IDS = {
  BRAND: 'brand',
  MANIFESTO: 'manifesto',
  CALENDAR: 'calendar',
  MUSIC: 'music',
  LINKS: 'links',
  SETTINGS: 'settings',
  ABOUT: 'about',
  STUDIO: 'studio',
  MURDER_TREE: 'murdertree',
  AUCTIONS: 'auctions',
  SEEKER: 'seeker',
} as const;

export type AppId = (typeof APP_IDS)[keyof typeof APP_IDS];

// App component props interface
export interface AppProps {
  windowId: string;
}

// App configuration interface
export interface AppConfig {
  id: AppId;
  title: string;
  icon: ReactNode;
  component: ComponentType<AppProps> | null; // null for placeholder
  resizable: boolean;
  defaultSize?: { width: number; height: number };
  /** Optional help panel configuration */
  helpConfig?: {
    showHelpButton: boolean;
    helpTitle?: string;
    helpContent?: ReactNode;
  };
  /** Optional mock states configuration (dev mode only) */
  mockStatesConfig?: {
    showMockStatesButton: boolean;
  };
}

// App Registry - all 10 apps from SPEC.md
export const APP_REGISTRY: Record<AppId, AppConfig> = {
  // Core Apps (7)
  [APP_IDS.BRAND]: {
    id: APP_IDS.BRAND,
    title: 'Brand Assets',
    icon: <RadMarkIcon size={20} />, // Keep RadMarkIcon as specified
    component: BrandAssetsApp,
    resizable: true,
  },
  [APP_IDS.MANIFESTO]: {
    id: APP_IDS.MANIFESTO,
    title: 'Manifesto',
    icon: <Icon name="document" size={20} />,
    component: ManifestoApp,
    resizable: true,
  },
  [APP_IDS.CALENDAR]: {
    id: APP_IDS.CALENDAR,
    title: 'Events',
    icon: <Icon name="calendar" size={20} />,
    component: CalendarApp,
    resizable: true,
  },
  [APP_IDS.MUSIC]: {
    id: APP_IDS.MUSIC,
    title: 'Rad Radio',
    icon: <Icon name="broadcast-dish" size={20} />,
    component: RadRadioApp,
    resizable: true,
  },
  [APP_IDS.LINKS]: {
    id: APP_IDS.LINKS,
    title: 'Links',
    icon: <Icon name="globe" size={20} />,
    component: LinksApp,
    resizable: true,
  },
  [APP_IDS.SETTINGS]: {
    id: APP_IDS.SETTINGS,
    title: 'Settings',
    icon: <Icon name="settings-cog" size={20} />,
    component: SettingsApp,
    resizable: false,
  },
  [APP_IDS.ABOUT]: {
    id: APP_IDS.ABOUT,
    title: 'About',
    icon: <Icon name="question" size={20} />,
    component: AboutApp,
    resizable: true,
  },

  // Additional Apps (3)
  [APP_IDS.STUDIO]: {
    id: APP_IDS.STUDIO,
    title: 'Radiants Studio',
    icon: <Icon name="code-window" size={20} />,
    component: RadiantsStudioApp,
    resizable: true,
  },
  [APP_IDS.MURDER_TREE]: {
    id: APP_IDS.MURDER_TREE,
    title: 'Murder Tree',
    icon: <Icon name="skull-and-crossbones" size={20} />,
    component: MurderTreeApp,
    resizable: true,
  },
  [APP_IDS.AUCTIONS]: {
    id: APP_IDS.AUCTIONS,
    title: 'Auctions',
    icon: <Icon name="coins" size={20} />,
    component: AuctionsApp,
    resizable: true,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Auction Help',
      helpContent: <AuctionsHelpContent />,
    },
    mockStatesConfig: {
      showMockStatesButton: true,
    },
  },
  [APP_IDS.SEEKER]: {
    id: APP_IDS.SEEKER,
    title: 'Seeker',
    icon: <Icon name="telephone" size={20} />,
    component: SeekerApp,
    resizable: false,
    defaultSize: { width: 400, height: 890 },
  },
};

// Helper functions
export function getAppConfig(id: string): AppConfig | undefined {
  return APP_REGISTRY[id as AppId];
}

export function getAllAppConfigs(): AppConfig[] {
  return Object.values(APP_REGISTRY);
}

export function getAllAppIds(): AppId[] {
  return Object.values(APP_IDS);
}

export function isValidAppId(id: string): id is AppId {
  return Object.values(APP_IDS).includes(id as AppId);
}

// Default window configurations
export const DEFAULT_CASCADE_OFFSET = 30;
export const DEFAULT_WINDOW_POSITION = { x: 50, y: 50 };
export const MAX_WINDOWS_WARNING = 5;
