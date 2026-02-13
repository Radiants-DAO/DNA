'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/icons';
import { WallpaperSwitcher } from './WallpaperSwitcher';
import type { WallpaperType } from './Wallpaper';

interface SystemBarProps {
  wallpaper: WallpaperType;
  onWallpaperChange: (type: WallpaperType) => void;
}

export function SystemBar({ wallpaper, onWallpaperChange }: SystemBarProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit',
      }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2
                    bg-black text-white font-space-mono text-[11px]
                    uppercase tracking-wider relative z-[9998] select-none">
      {/* Left: Logo + brand + menu */}
      <div className="flex items-center gap-6">
        <Logo variant="logomark" height="1.25rem" className="text-white" useBlendMode={false} />
        <span className="hidden md:inline font-bold">Layer33</span>
        <span className="hidden md:inline opacity-60">File</span>
        <span className="hidden md:inline opacity-60">Edit</span>
        <span className="hidden md:inline opacity-60">View</span>
      </div>

      {/* Center: Tagline */}
      <span className="hidden md:inline opacity-60 text-[10px]">
        Independent validators, Collective strength
      </span>

      {/* Right: Wallpaper switcher + clock */}
      <div className="flex items-center gap-4">
        <WallpaperSwitcher active={wallpaper} onChange={onWallpaperChange} />
        <span className="tabular-nums">{time}</span>
      </div>
    </div>
  );
}
