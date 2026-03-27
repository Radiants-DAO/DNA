import type { ReactNode } from 'react';
import type { WindowContentMode } from '../lib/types';

const modeClassNames: Record<WindowContentMode, string> = {
  'single-column': 'mx-auto flex h-full max-w-3xl flex-col gap-6 p-6',
  sidebar: 'grid h-full grid-cols-[16rem_1fr]',
  tabbed: 'flex h-full flex-col',
  'full-bleed': 'h-full'
};

export function WindowContent({
  mode = 'single-column',
  children
}: {
  mode?: WindowContentMode;
  children: ReactNode;
}) {
  return <div className={modeClassNames[mode]}>{children}</div>;
}
