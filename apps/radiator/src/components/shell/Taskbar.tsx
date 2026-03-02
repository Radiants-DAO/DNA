'use client';

import { useEffect, useState } from 'react';
import { Button, IconButton } from '@rdna/radiants/components/core';
import { Menu, DarkModeIcon } from '@rdna/radiants/icons';

const DARK_MODE_KEY = 'radiator-dark-mode';

export function Taskbar() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleDarkMode = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(DARK_MODE_KEY, String(next));
    setIsDark(next);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-(--z-index-chrome) flex items-center justify-between px-2 py-2">
      {/* Left — Start button */}
      <Button variant="primary" size="md" icon={<Menu size={16} />}>
        Start
      </Button>

      {/* Right — pill bar */}
      <div className="bg-surface-primary border border-edge-primary rounded-sm p-1 flex items-center gap-0.5">
        <IconButton
          icon={<DarkModeIcon size={16} />}
          variant="ghost"
          size="md"
          aria-label="Toggle dark mode"
          onClick={toggleDarkMode}
        />
      </div>
    </div>
  );
}
