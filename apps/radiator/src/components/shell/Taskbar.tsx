'use client';

import { Button, IconButton } from '@rdna/radiants/components/core';
import { DarkModeIcon } from '@rdna/radiants/icons';

export function Taskbar() {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-between px-2 py-2">
      {/* Left — Start button */}
      <Button variant="primary" size="md">
        Start
      </Button>

      {/* Right — pill bar */}
      <div className="bg-surface-primary border border-edge-primary rounded-sm p-1 flex items-center gap-0.5">
        <IconButton
          variant="ghost"
          size="md"
          aria-label="Toggle dark mode"
          onClick={toggleDarkMode}
        >
          <DarkModeIcon size={16} />
        </IconButton>
      </div>
    </div>
  );
}
