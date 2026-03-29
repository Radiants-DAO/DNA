import { type ComponentType, type ReactNode } from 'react';
import { Icon } from '@rdna/radiants/icons/runtime';
import type { WindowSize, WindowSizeTier } from './windowSizing';

// ============================================================================
// Types
// ============================================================================

export interface AppProps {
  windowId: string;
}

export type StartMenuSection = 'apps';

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
  desktopVisible?: boolean;
  startMenuSection?: StartMenuSection;
}

// ============================================================================
// Catalog — add your apps here
// ============================================================================

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'prototype',
    windowTitle: '__APP_PASCAL_NAME__',
    windowIcon: <Icon name="sparkles" large />,
    component: null, // Replace with your app component
    defaultSize: 'md',
    resizable: true,
    desktopVisible: true,
    startMenuSection: 'apps',
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
  return APP_CATALOG.filter((app) => app.desktopVisible).map((app) => ({
    id: app.id,
    label: app.launcherTitle ?? app.windowTitle,
    icon: app.launcherIcon ?? app.windowIcon,
  }));
}

export function getStartMenuSections(): Record<
  StartMenuSection,
  Array<{ id: string; label: string; icon: ReactNode }>
> {
  return {
    apps: APP_CATALOG.filter((app) => app.startMenuSection === 'apps').map((app) => ({
      id: app.id,
      label: app.launcherTitle ?? app.windowTitle,
      icon: app.launcherIcon ?? app.windowIcon,
    })),
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
  };
}
