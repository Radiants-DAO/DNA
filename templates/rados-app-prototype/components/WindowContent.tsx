import type { ReactNode } from 'react';
import type { WindowContentMode } from '../lib/types';

const modeClassNames: Record<WindowContentMode, string> = {
  'single-column': 'mx-auto flex max-w-3xl flex-col gap-6 p-6',
  sidebar: 'grid min-h-0 grid-cols-[16rem_1fr]',
  tabbed: 'flex min-h-0 flex-col',
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
