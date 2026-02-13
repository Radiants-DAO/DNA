'use client';

import { Icon } from '@/components/icons';
import { Tooltip } from '@/components/ui';

export interface DockItem {
  id: string;
  title: string;
  iconName: string;
  isOpen: boolean;
}

interface DockProps {
  items: DockItem[];
  onOpen: (id: string) => void;
}

export function Dock({ items, onOpen }: DockProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998]
                    flex items-center gap-2 px-4 py-2
                    bg-white/90 border border-black
                    shadow-[4px_4px_0_0_var(--color-black)]
                    backdrop-blur-sm">
      {items.map((item) => (
        <Tooltip key={item.id} content={item.title} position="top">
          <button
            onClick={() => onOpen(item.id)}
            className={`
              w-10 h-10 border border-black flex items-center justify-center
              transition-all duration-150 ease-btn
              hover:-translate-y-1 hover:shadow-[2px_2px_0_0_var(--color-black)]
              active:translate-y-0 active:shadow-none
              ${item.isOpen
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-neutral-neutral-1'
              }
            `}
          >
            <Icon name={item.iconName} size={20} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
