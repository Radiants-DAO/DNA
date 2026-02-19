'use client';

import Image from 'next/image';
import { Icon } from '@/components/icons';

interface AppHeaderProps {
  title: string;
  isWalletConnected: boolean;
  radiantImage?: string;
}

export function AppHeader({ title, isWalletConnected, radiantImage }: AppHeaderProps) {
  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
      <button className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-cream transition-colors">
        <Icon name="settings-cog" size={18} />
      </button>
      <span className="font-joystix text-xs text-cream tracking-wider">{title}</span>
      {isWalletConnected && radiantImage ? (
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-sun-yellow/60">
          <Image
            src={radiantImage}
            alt="Your Radiant"
            width={28}
            height={28}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <button className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-cream transition-colors">
          <Icon name="coins" size={18} />
        </button>
      )}
    </div>
  );
}
