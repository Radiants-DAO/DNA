'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '../hooks/useWindowManager';
import { getStartMenuSections } from '../lib/catalog';
import { Button, Separator } from '@rdna/radiants/components/core';
import { WordmarkLogo } from '@rdna/radiants/icons/runtime';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MenuItem({
  item,
  onClick,
}: {
  item: { id: string; label: string; icon: React.ReactNode };
  onClick: () => void;
}) {
  return (
    <Button
      key={item.id}
      type="button"
      quiet
      size="sm"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-hover active:bg-active text-left"
    >
      <span className="w-5 h-5 flex items-center justify-center text-main shrink-0">
        {item.icon}
      </span>
      <span className="flex-1 font-joystix text-sm text-main uppercase">{item.label}</span>
    </Button>
  );
}

export function StartMenu({ isOpen, onClose }: StartMenuProps) {
  const { openWindow } = useWindowManager();
  const menuRef = useRef<HTMLDivElement>(null);
  const sections = getStartMenuSections();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-start-button]')) return;
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAppClick = (appId: string) => {
    openWindow(appId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 flex flex-row bg-page pixel-shadow-floating pixel-rounded-sm z-10 w-72"
    >
      {/* Left sidebar — branding strip */}
      <div
        className="w-10 bg-inv flex items-end justify-start pb-3 shrink-0"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        <WordmarkLogo className="h-3 w-auto" color="cream" />
      </div>

      {/* Menu content */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="py-1">
          <div className="px-3 py-1">
            <span className="font-joystix text-sm text-mute uppercase">Apps</span>
          </div>
          {sections.apps.map((item) => (
            <MenuItem key={item.id} item={item} onClick={() => handleAppClick(item.id)} />
          ))}
        </div>

        <Separator className="mx-2" />

        <div className="bg-depth px-3 py-2 border-t border-rule flex items-center justify-between mt-auto">
          <span className="font-mondwest text-sm text-mute">__APP_PASCAL_NAME__ v1.0</span>
        </div>
      </div>
    </div>
  );
}
