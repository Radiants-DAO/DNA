import type { ReactNode } from 'react';

export interface AppProps {
  windowId: string;
}

export type WindowContentMode =
  | 'single-column'
  | 'sidebar'
  | 'tabbed'
  | 'full-bleed';

export interface WindowSizePreset {
  label: string;
  width: number;
  height: number;
}

export interface AppWindowProps {
  title: string;
  children: ReactNode;
  titleBarActions?: ReactNode;
}
