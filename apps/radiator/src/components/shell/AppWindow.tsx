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
        border border-edge-primary rounded-md overflow-hidden
        flex flex-col shadow-card-lg
      "
      style={{
        background: 'linear-gradient(0deg, var(--color-window-chrome-from, var(--color-surface-primary)), var(--color-window-chrome-to, var(--color-surface-secondary)))',
      }}
    >
      <WindowTitleBar />
      <div className="flex-1 min-h-0 overflow-y-auto rounded-sm @container">
        {children}
      </div>
    </div>
  );
}
