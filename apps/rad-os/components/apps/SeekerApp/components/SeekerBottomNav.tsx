'use client';

import { Icon } from '@/components/icons';
import type { SeekerTab } from '../types';

const NAV_ITEMS: { tab: SeekerTab; icon: string; label: string }[] = [
  { tab: 'info', icon: 'document', label: 'Info' },
  { tab: 'music', icon: 'music-8th-notes', label: 'Music' },
  { tab: 'chat', icon: 'comments-typing', label: 'Chat' },
  { tab: 'camera', icon: 'camera', label: 'Camera' },
];

interface SeekerBottomNavProps {
  activeTab: SeekerTab;
  onTabChange: (tab: SeekerTab) => void;
}

export function SeekerBottomNav({ activeTab, onTabChange }: SeekerBottomNavProps) {
  return (
    <div className="h-16 bg-surface-primary border-t border-edge-muted flex items-center justify-around shrink-0">
      {NAV_ITEMS.map(({ tab, icon, label }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
              isActive ? 'text-content-primary' : 'text-content-muted hover:text-content-primary/70'
            }`}
          >
            <Icon name={icon} size={20} />
            <span className="font-mono text-[10px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
