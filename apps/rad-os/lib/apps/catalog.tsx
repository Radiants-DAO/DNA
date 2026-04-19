import { lazy, type ComponentType, type ReactNode } from 'react';
import { RadMarkIcon, Icon, FontAaIcon } from '@rdna/radiants/icons/runtime';
import type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';

const BrandAssetsApp = lazy(() => import('@/components/apps/BrandAssetsApp'));
const ManifestoApp = lazy(() => import('@/components/apps/ManifestoApp'));
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const RadRadioApp = lazy(() => import('@/components/apps/RadRadioApp'));
const GoodNewsApp = lazy(() => import('@/components/apps/GoodNewsApp'));
const ScratchpadApp = lazy(() => import('@/components/apps/ScratchpadApp'));
const StudioApp = lazy(() => import('@/components/apps/StudioApp'));

export interface AppProps {
  windowId: string;
}

export type StartMenuCategory = 'tools' | 'media' | 'about' | 'links';

export interface StartMenuCategoryDef {
  id: StartMenuCategory;
  label: string;
  icon: ReactNode;
}

export const START_MENU_CATEGORIES: StartMenuCategoryDef[] = [
  { id: 'tools', label: 'Tools', icon: <Icon name="wrench" /> },
  { id: 'media', label: 'Media', icon: <Icon name="broadcast-dish" /> },
  { id: 'about', label: 'About', icon: <Icon name="question" /> },
  { id: 'links', label: 'Links', icon: <Icon name="globe" /> },
];

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

export interface AppSubtab {
  id: string;
  label: string;
  icon?: ReactNode;
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
  category?: StartMenuCategory;
  subtabs?: AppSubtab[];
  ambient?: AmbientCapability;
}

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'brand',
    windowTitle: 'Design Codex',
    launcherTitle: 'Design Codex',
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
    category: 'tools',
    subtabs: [
      { id: 'logos', label: 'Logos', icon: <RadMarkIcon /> },
      { id: 'colors', label: 'Color', icon: <Icon name="pencil" /> },
      { id: 'fonts', label: 'Type', icon: <FontAaIcon /> },
      { id: 'components', label: 'UI Library', icon: <Icon name="outline-box" /> },
      { id: 'ai-gen', label: 'AI', icon: <Icon name="usericon" /> },
    ],
  },
  {
    id: 'studio',
    windowTitle: 'Studio',
    launcherTitle: 'Studio',
    windowIcon: <Icon name="design-color-bucket" large />,
    component: StudioApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    category: 'tools',
  },
  {
    id: 'scratchpad',
    windowTitle: 'Scratchpad',
    windowIcon: <Icon name="pencil" large />,
    component: ScratchpadApp,
    defaultSize: 'lg',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    category: 'tools',
  },
  {
    id: 'music',
    windowTitle: 'Rad Radio',
    launcherTitle: 'Rad Radio',
    windowIcon: <Icon name="broadcast-dish" large />,
    launcherIcon: <Icon name="music-8th-notes" large />,
    component: RadRadioApp,
    defaultSize: 'md',
    resizable: false,
    contentPadding: false,
    desktopVisible: true,
    category: 'media',
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
    category: 'media',
  },
  {
    id: 'about',
    windowTitle: 'About',
    windowIcon: <Icon name="question" large />,
    component: AboutApp,
    defaultSize: 'md',
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    category: 'about',
  },
  {
    id: 'manifesto',
    windowTitle: 'Becoming Substance',
    windowIcon: <Icon name="document" large />,
    component: ManifestoApp,
    defaultSize: { width: '42rem', height: '44rem' },
    resizable: true,
    contentPadding: false,
    desktopVisible: true,
    category: 'about',
  },
];

export interface StartMenuLink {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
}

export const START_MENU_LINKS: StartMenuLink[] = [
  { id: 'twitter', label: 'Twitter', href: 'https://twitter.com/radiants', icon: <Icon name="twitter" /> },
  { id: 'discord', label: 'Discord', href: 'https://discord.gg/radiants', icon: <Icon name="discord" /> },
];

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

export interface StartMenuAppEntry {
  id: string;
  label: string;
  icon: ReactNode;
  subtabs?: AppSubtab[];
}

export function getStartMenuCategories(): Array<StartMenuCategoryDef & {
  apps: StartMenuAppEntry[];
  links?: StartMenuLink[];
}> {
  return START_MENU_CATEGORIES.map((cat) => {
    if (cat.id === 'links') {
      return { ...cat, apps: [], links: START_MENU_LINKS };
    }
    return {
      ...cat,
      apps: APP_CATALOG
        .filter((app) => app.category === cat.id)
        .map((app) => ({
          id: app.id,
          label: app.launcherTitle ?? app.windowTitle,
          icon: app.launcherIcon ?? app.windowIcon,
          subtabs: app.subtabs,
        })),
    };
  });
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
