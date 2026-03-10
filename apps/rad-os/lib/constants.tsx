import React, { ReactNode, ComponentType, lazy } from 'react';
import {
  RadMarkIcon,
  Icon,
} from '@/components/icons';
// Lazy load all apps for better initial load performance
const BrandAssetsApp = lazy(() => import('@/components/apps/BrandAssetsApp'));
const ManifestoApp = lazy(() => import('@/components/apps/ManifestoApp'));
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const LinksApp = lazy(() => import('@/components/apps/LinksApp'));
const SettingsApp = lazy(() => import('@/components/apps/SettingsApp'));
const RadRadioApp = lazy(() => import('@/components/apps/RadRadioApp'));
const RadiantsStudioApp = lazy(() => import('@/components/apps/RadiantsStudioApp'));
const SeekerApp = lazy(() => import('@/components/apps/SeekerApp'));

// Trash registry — lazy-loaded from trash/apps/
import { TRASH_REGISTRY, TRASH_APP_IDS } from '@/trash/registry';

// App IDs as const for type safety
export const APP_IDS = {
  BRAND: 'brand',
  MANIFESTO: 'manifesto',
  MUSIC: 'music',
  LINKS: 'links',
  SETTINGS: 'settings',
  ABOUT: 'about',
  STUDIO: 'studio',
  SEEKER: 'seeker',
  TRASH: 'trash',
} as const;

export type AppId = (typeof APP_IDS)[keyof typeof APP_IDS] | string;

// App component props interface
export interface AppProps {
  windowId: string;
}

// Window size presets (rem-based, scale with root font-size)
export const WINDOW_SIZES = {
  sm:  { width: '30rem', height: '25rem' },
  md:  { width: '48rem', height: '36rem' },
  lg:  { width: '69rem', height: '50rem' },
  xl:  { width: '86rem', height: '60rem' },
} as const;

export type WindowSizeTier = keyof typeof WINDOW_SIZES;
export type WindowSize = { width: string; height: string };

/** Resolve a size tier or custom size to CSS strings */
export function resolveWindowSize(size: WindowSizeTier | WindowSize): WindowSize {
  if (typeof size === 'string') return WINDOW_SIZES[size];
  return size;
}

/** Convert a rem string to px using the current root font-size */
export function remToPx(value: string): number {
  const rem = parseFloat(value);
  if (typeof document !== 'undefined') {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  return rem * 16;
}

// App configuration interface
export interface AppConfig {
  id: AppId;
  title: string;
  icon: ReactNode;
  component: ComponentType<AppProps> | null; // null for placeholder
  resizable: boolean;
  defaultSize?: WindowSizeTier | WindowSize;
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
  /** Add bottom padding to the content area (default: true) */
  contentPadding?: boolean;
  /** Show the widget mode button in the title bar */
  showWidgetButton?: boolean;
  /** App is in the trash — not shown on desktop or start menu */
  trashed?: boolean;
  /** Date the app was trashed (ISO string) */
  trashedDate?: string;
}

// Trash app component
const TrashApp = lazy(() => import('@/components/apps/TrashApp'));

// App Registry
export const APP_REGISTRY: Record<string, AppConfig> = {
  // Core Apps (7)
  [APP_IDS.BRAND]: {
    id: APP_IDS.BRAND,
    title: 'Brand Assets',
    icon: <RadMarkIcon size={20} />,
    component: BrandAssetsApp,
    resizable: true,
    defaultSize: 'lg',
    contentPadding: false,
  },
  [APP_IDS.MANIFESTO]: {
    id: APP_IDS.MANIFESTO,
    title: 'Manifesto',
    icon: <Icon name="document" size={20} />,
    component: ManifestoApp,
    resizable: true,
    defaultSize: 'lg',
    contentPadding: false,
  },
  [APP_IDS.MUSIC]: {
    id: APP_IDS.MUSIC,
    title: 'Rad Radio',
    icon: <Icon name="broadcast-dish" size={20} />,
    component: RadRadioApp,
    resizable: true,
    defaultSize: 'md',
    contentPadding: false,
    showWidgetButton: true,
  },
  [APP_IDS.LINKS]: {
    id: APP_IDS.LINKS,
    title: 'Links',
    icon: <Icon name="globe" size={20} />,
    component: LinksApp,
    resizable: true,
    defaultSize: 'md',
  },
  [APP_IDS.SETTINGS]: {
    id: APP_IDS.SETTINGS,
    title: 'Settings',
    icon: <Icon name="settings-cog" size={20} />,
    component: SettingsApp,
    resizable: false,
    defaultSize: 'sm',
  },
  [APP_IDS.ABOUT]: {
    id: APP_IDS.ABOUT,
    title: 'About',
    icon: <Icon name="question" size={20} />,
    component: AboutApp,
    resizable: true,
    defaultSize: 'md',
  },

  // Additional Apps
  [APP_IDS.STUDIO]: {
    id: APP_IDS.STUDIO,
    title: 'Radiants Studio',
    icon: <Icon name="code-window" size={20} />,
    component: RadiantsStudioApp,
    resizable: true,
    defaultSize: 'lg',
    contentPadding: false,
  },
  [APP_IDS.SEEKER]: {
    id: APP_IDS.SEEKER,
    title: 'Seeker',
    icon: <Icon name="telephone" size={20} />,
    component: SeekerApp,
    resizable: false,
    defaultSize: { width: '25rem', height: '56rem' },
    contentPadding: false,
    mockStatesConfig: {
      showMockStatesButton: true,
    },
  },
  [APP_IDS.TRASH]: {
    id: APP_IDS.TRASH,
    title: 'Trash',
    icon: <Icon name="trash" size={20} />,
    component: TrashApp,
    resizable: true,
    defaultSize: 'sm',
  },

  // Trashed apps — still openable from the Trash app
  ...TRASH_REGISTRY,
};

// Helper functions
export function getAppConfig(id: string): AppConfig | undefined {
  return APP_REGISTRY[id];
}

export function getAllAppConfigs(): AppConfig[] {
  return Object.values(APP_REGISTRY).filter((c) => !c.trashed);
}

export function getTrashedAppConfigs(): AppConfig[] {
  return Object.values(APP_REGISTRY).filter((c) => c.trashed);
}

export function getAllAppIds(): AppId[] {
  return Object.values(APP_IDS);
}

export function getTrashedAppIds(): string[] {
  return Object.values(TRASH_APP_IDS);
}

export function isValidAppId(id: string): id is AppId {
  return id in APP_REGISTRY;
}

// Default window configurations
export const DEFAULT_CASCADE_OFFSET = 30;
export const DEFAULT_WINDOW_POSITION = { x: 50, y: 50 };
export const MAX_WINDOWS_WARNING = 5;
