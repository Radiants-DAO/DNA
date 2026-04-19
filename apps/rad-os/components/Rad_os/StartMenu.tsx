'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { getStartMenuSections } from '@/lib/apps';
import { Button, Separator } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface StartMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback to close the menu */
  onClose: () => void;
}

interface MenuItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// ============================================================================
// Tile
// ============================================================================

const TILE_CLASSES = '!h-auto !w-28 !flex-col !items-center !justify-start !gap-1 !py-2 !px-1 !whitespace-normal';

function AppTile({ item, onClick }: { item: MenuItemConfig; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Button
      type="button"
      quiet
      rounded="none"
      size="xl"
      textOnly
      onClick={onClick}
      className={TILE_CLASSES}
    >
      <span className="w-6 h-6 flex items-center justify-center shrink-0">
        {item.icon}
      </span>
      <span className="font-joystix text-xs uppercase text-center leading-tight w-full">
        {item.label}
      </span>
    </Button>
  );
}

// ============================================================================
// Start Menu Component
// ============================================================================

/**
 * Start Menu component:
 * - Desktop: Tile popup centered above Start button
 * - Mobile: Full-screen overlay
 */
export function StartMenu({ isOpen, onClose }: StartMenuProps) {
  const { openWindowWithZoom } = useWindowManager();
  const menuRef = useRef<HTMLDivElement>(null);

  const sections = getStartMenuSections();

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if click was on the Start button (don't close in that case)
        const target = e.target as HTMLElement;
        if (target.closest('[data-start-button]')) return;
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAppClick = (appId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openWindowWithZoom(appId, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    onClose();
  };

  if (!isOpen) return null;


  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-96"
    >
      <div className="pixel-rounded-sm pixel-shadow-floating">
        <div className="flex flex-col items-center justify-center bg-page">
          {/* Core Apps Section */}
          <div className="w-full pt-2 pb-2 px-2 flex flex-col items-center">
            <div className="pb-1">
              <span className="font-joystix text-sm text-mute uppercase">
                Apps
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {sections.apps.map((item) => (
                <AppTile
                  key={item.id}
                  item={item}
                  onClick={(e: React.MouseEvent) => handleAppClick(item.id, e)}
                />
              ))}
            </div>
          </div>

          {sections.web3.length > 0 && (
            <>
              <Separator className="mx-2" />
              <div className="w-full pt-2 pb-2 px-2 flex flex-col items-center">
                <div className="pb-1">
                  <span className="font-joystix text-sm text-mute uppercase">
                    Web3
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {sections.web3.map((item) => (
                    <AppTile
                      key={item.id}
                      item={item}
                      onClick={(e: React.MouseEvent) => handleAppClick(item.id, e)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="w-full bg-depth px-3 py-2 border-t border-rule flex items-center justify-center">
            <span className="font-mondwest text-sm text-mute">RadOS v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartMenu;
