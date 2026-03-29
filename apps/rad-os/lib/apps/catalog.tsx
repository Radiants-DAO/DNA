import { lazy, type ComponentType, type ReactNode } from 'react';
import { RadMarkIcon, Icon } from '@rdna/radiants/icons/runtime';
import type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';


// Lazy load all apps for better initial load performance
const BrandAssetsApp = lazy(() => import('@/components/apps/BrandAssetsApp'));
const ManifestoApp = lazy(() => import('@/components/apps/ManifestoApp'));
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const RadRadioApp = lazy(() => import('@/components/apps/RadRadioApp'));
const RadiantsStudioApp = lazy(() => import('@/components/apps/RadiantsStudioApp'));
const GoodNewsApp = lazy(() => import('@/components/apps/GoodNewsApp'));
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
  desktopVisible?: boolean;
  startMenuSection?: StartMenuSection;
  ambient?: AmbientCapability;
}

// ============================================================================
// Catalog Entries
// ============================================================================

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'brand',
    windowTitle: 'Design Codex',
    launcherTitle: 'Brand & Press',
    windowIcon: <RadMarkIcon large />,
    component: BrandAssetsApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Design Codex',
    },
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'manifesto',
    windowTitle: 'Manifesto',
    windowIcon: <Icon name="document" large />,
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
    windowIcon: <Icon name="broadcast-dish" large />,
    launcherIcon: <Icon name="music-8th-notes" large />,
    component: RadRadioApp,
    defaultSize: 'md',
    resizable: false,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'about',
    windowTitle: 'About',
    windowIcon: <Icon name="question" large />,
    component: AboutApp,
    defaultSize: 'md',
    resizable: true,
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'good-news',
    windowTitle: 'Good News',
    windowIcon: <Icon name="newspaper" large />,
    component: GoodNewsApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'apps',
  },
  {
    id: 'studio',
    windowTitle: 'Radiants Studio',
    windowIcon: <Icon name="code-window" large />,
    component: RadiantsStudioApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    startMenuSection: 'web3',
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
    .filter((app) => app.desktopVisible)
    .map((app) => ({
      id: app.id,
      label: app.launcherTitle ?? app.windowTitle,
      icon: app.launcherIcon ?? app.windowIcon,
    }));
}

export function getStartMenuSections(): Record<StartMenuSection, Array<{ id: string; label: string; icon: ReactNode }>> {
  return {
    apps: APP_CATALOG
      .filter((app) => app.startMenuSection === 'apps')
      .map((app) => ({ id: app.id, label: app.launcherTitle ?? app.windowTitle, icon: app.launcherIcon ?? app.windowIcon })),
    web3: APP_CATALOG
      .filter((app) => app.startMenuSection === 'web3')
      .map((app) => ({ id: app.id, label: app.launcherTitle ?? app.windowTitle, icon: app.launcherIcon ?? app.windowIcon })),
  };
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
