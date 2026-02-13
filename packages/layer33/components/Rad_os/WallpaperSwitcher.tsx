'use client';

import type { WallpaperType } from './Wallpaper';

interface WallpaperSwitcherProps {
  active: WallpaperType;
  onChange: (type: WallpaperType) => void;
}

const options: { type: WallpaperType; label: string }[] = [
  { type: 'video', label: 'V' },
  { type: 'geometric', label: 'G' },
  { type: 'minimal', label: 'M' },
  { type: 'grid', label: 'D' },
];

export function WallpaperSwitcher({ active, onChange }: WallpaperSwitcherProps) {
  return (
    <div className="flex gap-1">
      {options.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`w-6 h-6 border border-white/30 font-space-mono text-[10px] uppercase
            transition-all duration-100
            ${active === type
              ? 'bg-white text-black'
              : 'bg-transparent text-white/60 hover:text-white hover:border-white/60'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
