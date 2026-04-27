import { lazy, type ComponentType, type ReactNode } from 'react';
import { RadMarkIcon, Icon, FontAaIcon } from '@rdna/radiants/icons/runtime';
import type { WindowSize, WindowSizeTier } from '@/lib/windowSizing';

const BrandApp = lazy(() => import('@/components/apps/BrandApp'));
const LabApp = lazy(() => import('@/components/apps/LabApp'));
const PixelLabApp = lazy(() => import('@/components/apps/pixel-lab/PixelLab'));
const ManifestoApp = lazy(() =>
  import('@/components/apps/manifesto/ManifestoBook').then((m) => ({
    default: m.ManifestoBook,
  })),
);
const AboutApp = lazy(() => import('@/components/apps/AboutApp'));
const PreferencesApp = lazy(() => import('@/components/apps/PreferencesApp'));
const GoodNewsApp = lazy(() =>
  import('@/components/apps/goodnews/GoodNewsLegacyApp').then((m) => ({
    default: m.GoodNewsLegacyApp,
  })),
);
const ScratchpadApp = lazy(() => import('@/components/apps/ScratchpadApp'));
const HackathonExeApp = lazy(() => import('@/components/apps/HackathonExeApp'));

const NEAR_SQUARE_APP_ASPECT_RATIO = 1.01;
const NEAR_SQUARE_APP_SIZE = { width: '46rem', height: '47.8125rem' } as const;

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
  minSize?: { width: number; height: number };
  /** Lock the content area (below titlebar/toolbar) to width:height. 1 = square. */
  aspectRatio?: number;
  contentPadding?: boolean;
  /** When true the window renders without titlebar/shell chrome. The app component must supply its own frame and drag handle. */
  chromeless?: boolean;
  helpConfig?: AppHelpConfig;
  desktopVisible?: boolean;
  category?: StartMenuCategory;
  subtabs?: AppSubtab[];
  ambient?: AmbientCapability;
}

export const APP_CATALOG: AppCatalogEntry[] = [
  {
    id: 'brand',
    windowTitle: 'Brand',
    launcherTitle: 'Brand',
    windowIcon: <Icon name="design-color-palette-sample" large />,
    component: BrandApp,
    defaultSize: NEAR_SQUARE_APP_SIZE,
    aspectRatio: NEAR_SQUARE_APP_ASPECT_RATIO,
    contentPadding: false,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Brand',
    },
    desktopVisible: true,
    category: 'tools',
    subtabs: [
      { id: 'logos', label: 'Logos', icon: <RadMarkIcon /> },
      { id: 'colors', label: 'Color', icon: <Icon name="pencil" /> },
      { id: 'fonts', label: 'Type', icon: <FontAaIcon /> },
    ],
  },
  {
    id: 'lab',
    windowTitle: 'Dev Tools',
    launcherTitle: 'Dev Tools',
    windowIcon: <Icon name="code-window" large />,
    component: LabApp,
    defaultSize: 'lg',
    contentPadding: false,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Dev Tools',
    },
    desktopVisible: true,
    category: 'tools',
    subtabs: [
      { id: 'components', label: 'UI Library', icon: <Icon name="code-window" /> },
    ],
  },
  {
    id: 'pixel-lab',
    windowTitle: 'Pixel Lab',
    launcherTitle: 'Pixel Lab',
    windowIcon: <Icon name="school-science-test-flask" large />,
    component: PixelLabApp,
    defaultSize: NEAR_SQUARE_APP_SIZE,
    minSize: { width: 640, height: 460 },
    aspectRatio: NEAR_SQUARE_APP_ASPECT_RATIO,
    contentPadding: false,
    helpConfig: {
      showHelpButton: true,
      helpTitle: 'Pixel Lab',
    },
    desktopVisible: true,
    category: 'tools',
    subtabs: [
      { id: 'radiants', label: 'Radiants', icon: <Icon name="rad-mark" /> },
      { id: 'corners', label: 'Corners', icon: <Icon name="resize-corner" /> },
      { id: 'icons', label: 'Icons', icon: <Icon name="document-image" /> },
      { id: 'patterns', label: 'Patterns', icon: <Icon name="css-grid" /> },
      { id: 'dither', label: 'Dither', icon: <Icon name="equalizer" /> },
      { id: 'canvas', label: 'Canvas', icon: <Icon name="pencil" /> },
    ],
  },
  {
    id: 'preferences',
    windowTitle: 'Preferences',
    launcherTitle: 'Preferences',
    windowIcon: <Icon name="settings-cog" large />,
    component: PreferencesApp,
    defaultSize: { width: '44rem', height: '48rem' },
    minSize: { width: 560, height: 520 },
    contentPadding: false,
    desktopVisible: false,
    category: 'tools',
    subtabs: [
      { id: 'preferences', label: 'Preferences', icon: <Icon name="settings-cog" /> },
      { id: 'theme', label: 'Theme', icon: <Icon name="design-color-palette-sample" /> },
    ],
  },
  {
    id: 'scratchpad',
    windowTitle: 'Scratchpad',
    windowIcon: <Icon name="pencil" large />,
    component: ScratchpadApp,
    defaultSize: 'lg',
    contentPadding: false,
    desktopVisible: true,
    category: 'tools',
  },
  // Radio lives as a taskbar-hosted drop-down widget (see
  // `components/apps/radio/RadioWidget.tsx` + transport strip in Taskbar),
  // not as a launchable AppWindow — no catalog entry.
  {
    id: 'hackathon-exe',
    windowTitle: 'Hackathon.EXE',
    launcherTitle: 'Hackathon.EXE',
    windowIcon: <Icon name="code-window" large />,
    component: HackathonExeApp,
    defaultSize: { width: '52rem', height: '38rem' },
    minSize: { width: 520, height: 420 },
    contentPadding: false,
    desktopVisible: true,
    category: 'media',
    subtabs: [
      { id: 'winners', label: 'Winners', icon: <Icon name="trophy" /> },
      { id: 'submissions', label: 'Submissions', icon: <Icon name="content-files-newspaper" /> },
      { id: 'archive', label: 'Archive', icon: <Icon name="content-files-open-book" /> },
    ],
  },
  {
    id: 'good-news',
    windowTitle: 'Good News',
    windowIcon: <Icon name="content-files-newspaper" large />,
    component: GoodNewsApp,
    defaultSize: 'lg',
    contentPadding: false,
    desktopVisible: true,
    category: 'media',
  },
  {
    id: 'about',
    windowTitle: 'About',
    windowIcon: <Icon name="info-filled" large />,
    component: AboutApp,
    defaultSize: 'md',
    contentPadding: false,
    desktopVisible: true,
    category: 'about',
  },
  {
    id: 'manifesto',
    windowTitle: 'Becoming Substance',
    windowIcon: <Icon name="content-files-open-book" large />,
    component: ManifestoApp,
    defaultSize: { width: '42rem', height: '44rem' },
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
    minSize: app.minSize,
    aspectRatio: app.aspectRatio,
    contentPadding: app.contentPadding,
    chromeless: app.chromeless,
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
