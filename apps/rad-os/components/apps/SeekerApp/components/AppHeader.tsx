'use client';

import { Icon } from '@/components/icons';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
      <button className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-cream transition-colors">
        <Icon name="settings-cog" size={18} />
      </button>
      <span className="font-joystix text-xs text-cream tracking-wider">{title}</span>
      <button className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-cream transition-colors">
        <Icon name="coins" size={18} />
      </button>
    </div>
  );
}
