'use client';

import Image from 'next/image';
import { Icon } from '@/components/icons';

interface AppHeaderProps {
  title: string;
  isWalletConnected: boolean;
  radiantImage?: string;
  onSettingsClick?: () => void;
}

export function AppHeader({ title, isWalletConnected, radiantImage, onSettingsClick }: AppHeaderProps) {
  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-edge-muted shrink-0">
      <button onClick={onSettingsClick} className="w-8 h-8 flex items-center justify-center text-content-muted hover:text-content-primary transition-colors">
        <Icon name="settings-cog" size={18} />
      </button>
      <span className="font-joystix text-xs text-content-primary tracking-wider">{title}</span>
      {isWalletConnected && radiantImage ? (
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-action-primary/60">
          <Image
            src={radiantImage}
            alt="Your Radiant"
            width={28}
            height={28}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <button className="w-8 h-8 flex items-center justify-center text-content-muted hover:text-content-primary transition-colors">
          <Icon name="coins" size={18} />
        </button>
      )}
    </div>
  );
}
