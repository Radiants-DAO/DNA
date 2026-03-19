'use client';

import { WindowTitleBar } from './WindowTitleBar';

interface AppWindowProps {
  children: React.ReactNode;
}

export function AppWindow({ children }: AppWindowProps) {
  return (
    <div
      className="
        w-full max-w-[68.75rem] h-full max-h-[43.75rem]
        border border-line pixel-rounded-lg overflow-hidden
        flex flex-col shadow-floating
      "
      style={{
        background: 'linear-gradient(0deg, var(--color-window-chrome-from, var(--color-page)), var(--color-window-chrome-to, var(--color-inv)))',
      }}
    >
      <WindowTitleBar />
      <div className="flex-1 min-h-0 overflow-y-auto pixel-rounded-sm @container">
        {children}
      </div>
    </div>
  );
}
