import React, { lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { RadMarkIcon, Icon } from '@rdna/radiants/icons';
import type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';
import { RadRadioAmbientWallpaper, RadRadioAmbientWidget, RadRadioAmbientController } from '@/components/apps/rad-radio/ambient';

// Lazy load all apps for better initial load performance
const BrandAssetsApp = lazy(() => import('@/components/apps/BrandAssetsApp'));
const ManifestoApp = lazy(() => import('@/components/apps/ManifestoApp'));
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const LinksApp = lazy(() => import('@/components/apps/LinksApp'));
const RadRadioApp = lazy(() => import('@/components/apps/RadRadioApp'));
const RadiantsStudioApp = lazy(() => import('@/components/apps/RadiantsStudioApp'));
const TrashApp = lazy(() => import('@/components/apps/TrashApp'));

// ============================================================================
// Types
// ============================================================================

export interface AppProps {
  windowId: string;
}

export type StartMenuSection = 'apps' | 'web3';

export interface AmbientCapability {
  wallpaper?: ComponentType;
  widget: ComponentType<{ appId: string; onExit: () => void }>;
  controller?: ComponentType;
}

export interface AppHelpConfig {
  showHelpButton: boolean;
  helpTitle?: string;
  helpContent?: ReactNode;
}

export interface AppMockStatesConfig {
  showMockStatesButton: boolean;
}

export interface AppCatalogEntry {
  id: string;
  windowTitle: string;
  launcherTitle?: string;
  windowIcon: ReactNode;
  launcherIcon?: ReactNode;
  component: ComponentType<AppProps> | null;
  defaultSize?: WindowSizeTier | WindowSize;
  resizable: boolean;
  contentPadding?: boolean;
  helpConfig?: AppHelpConfig;
  mockStatesConfig?: AppMockStatesConfig;
  desktopVisible?: boolean;
  startMenuSection?: StartMenuSection;
  trashed?: boolean;
  trashedDate?: string;
  ambient?: AmbientCapability;
}

// ============================================================================
// Catalog Entries
// ============================================================================

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'brand',
    windowTitle: 'Brand Assets',
    launcherTitle: 'Brand & Press',
    windowIcon: <RadMarkIcon size={20} />,
    component: BrandAssetsApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Brand Assets',
    },
    mockStatesConfig: {
      showMockStatesButton: true,
    },
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'manifesto',
    windowTitle: 'Manifesto',
    windowIcon: <Icon name="document" size={20} />,
    component: ManifestoApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'music',
    windowTitle: 'Rad Radio',
    launcherTitle: 'Music',
    windowIcon: <Icon name="broadcast-dish" size={20} />,
    launcherIcon: <Icon name="music-8th-notes" size={20} />,
    component: RadRadioApp,
    defaultSize: 'md',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'apps',
    ambient: {
      wallpaper: RadRadioAmbientWallpaper,
      widget: RadRadioAmbientWidget,
      controller: RadRadioAmbientController,
    },
  },
  {
    id: 'links',
    windowTitle: 'Links',
    windowIcon: <Icon name="globe" size={20} />,
    component: LinksApp,
    defaultSize: 'md',
    resizable: true,
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'about',
    windowTitle: 'About',
    windowIcon: <Icon name="question" size={20} />,
    component: AboutApp,
    defaultSize: 'md',
    resizable: true,
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'studio',
    windowTitle: 'Radiants Studio',
    windowIcon: <Icon name="code-window" size={20} />,
    component: RadiantsStudioApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'web3',
  },
  {
    id: 'trash',
    windowTitle: 'Trash',
    windowIcon: <Icon name="trash" size={20} />,
    component: TrashApp,
    defaultSize: 'sm',
    resizable: true,
    desktopVisible: false,
  },
];

// ============================================================================
// Index & Selectors
// ============================================================================

const APP_BY_ID = Object.fromEntries(APP_CATALOG.map((app) => [app.id, app]));

export function getApp(id: string): AppCatalogEntry | undefined {
  return APP_BY_ID[id];
}

export function isValidAppId(id: string): boolean {
  return id in APP_BY_ID;
}

export function getDesktopLaunchers(): Array<{ id: string; label: string; icon: ReactNode }> {
  return APP_CATALOG
    .filter((app) => app.desktopVisible && !app.trashed)
    .map((app) => ({
      id: app.id,
      label: app.launcherTitle ?? app.windowTitle,
      icon: app.launcherIcon ?? app.windowIcon,
    }));
}

export function getStartMenuSections(): Record<StartMenuSection, Array<{ id: string; label: string; icon: ReactNode }>> {
  return {
    apps: APP_CATALOG
      .filter((app) => app.startMenuSection === 'apps' && !app.trashed)
      .map((app) => ({ id: app.id, label: app.launcherTitle ?? app.windowTitle, icon: app.launcherIcon ?? app.windowIcon })),
    web3: APP_CATALOG
      .filter((app) => app.startMenuSection === 'web3' && !app.trashed)
      .map((app) => ({ id: app.id, label: app.launcherTitle ?? app.windowTitle, icon: app.launcherIcon ?? app.windowIcon })),
  };
}

export function getTrashedApps(): Array<{ id: string; title: string; icon: ReactNode; trashedDate?: string }> {
  return APP_CATALOG
    .filter((app) => app.trashed)
    .map((app) => ({ id: app.id, title: app.windowTitle, icon: app.windowIcon, trashedDate: app.trashedDate }));
}

export function getWindowChrome(id: string) {
  const app = getApp(id);
  if (!app) return undefined;
  return {
    windowTitle: app.windowTitle,
    windowIcon: app.windowIcon,
    defaultSize: app.defaultSize,
    resizable: app.resizable,
    contentPadding: app.contentPadding,
    helpConfig: app.helpConfig,
    mockStatesConfig: app.mockStatesConfig,
    ambient: app.ambient,
  };
}

export function supportsAmbientWidget(id: string): boolean {
  return Boolean(getApp(id)?.ambient?.widget);
}

export function getActiveAmbientApp(windows: Array<{ id: string; isOpen: boolean; isWidget: boolean }>) {
  const active = windows.find((w) => w.isOpen && w.isWidget && supportsAmbientWidget(w.id));
  if (!active) return null;
  const app = getApp(active.id)!;
  return { app, ambient: app.ambient! };
}
