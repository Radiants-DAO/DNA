'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { useSafeHover } from '@/hooks/useSafeHover';
import {
  getStartMenuCategories,
  type AppSubtab,
  type StartMenuCategory,
  type StartMenuLink,
} from '@/lib/apps';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';

// ============================================================================
// Types
// ============================================================================

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type AppHoverKey = `${StartMenuCategory}:${string}`;

// ============================================================================
// Menu row
// ============================================================================

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  hasChildren?: boolean;
  highlighted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerEnter?: (e: React.PointerEvent) => void;
  href?: string;
}

function MenuRow({
  icon,
  label,
  hasChildren,
  highlighted,
  onClick,
  onPointerEnter,
  href,
}: MenuRowProps) {
  const body = (
    <>
      <span className="w-5 h-5 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="flex-1 font-joystix text-sm uppercase text-left">
        {label}
      </span>
      {hasChildren && (
        <span className="shrink-0 w-3 h-3 flex items-center justify-center">
          <Icon name="chevron-right" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Button
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        quiet
        fullWidth
        rounded="none"
        size="lg"
        active={highlighted}
        onPointerEnter={onPointerEnter}
        className="gap-3"
      >
        {body}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      quiet
      fullWidth
      rounded="none"
      size="lg"
      active={highlighted}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      className="gap-3"
    >
      {body}
    </Button>
  );
}

// ============================================================================
// Start Menu
// ============================================================================

const COLUMN_WIDTH_PX = 240;

export function StartMenu({ isOpen, onClose }: StartMenuProps) {
  const { openWindowWithZoom, setActiveTab } = useWindowManager();
  const menuRef = useRef<HTMLDivElement>(null);

  // Two levels of safe-hover: category → submenu, and app → subtab submenu
  const catHover = useSafeHover<StartMenuCategory>();
  const appHover = useSafeHover<AppHoverKey>();

  const categoryRowRefs = useRef<Map<StartMenuCategory, HTMLDivElement | null>>(new Map());
  const appRowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const categories = getStartMenuCategories();
  const activeCategory = categories.find((c) => c.id === catHover.active) ?? null;
  const activeApp =
    activeCategory?.apps.find(
      (a) => appHover.active === `${activeCategory.id}:${a.id}`,
    ) ?? null;

  // Keep the latest onClose in a ref so we can depend only on `isOpen`.
  // Parents commonly pass an inline arrow for onClose, which would otherwise
  // re-run this effect on every parent render and reset hover state mid-hover.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Close behavior + reset hover state when the menu opens
  useEffect(() => {
    if (!isOpen) return;
    catHover.reset();
    appHover.reset();

    const handleClickOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-start-button]')) return;
        onCloseRef.current();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reason:reset-on-open-only owner:rad-os expires:2027-01-01 issue:DNA-startmenu
  }, [isOpen]);

  const launch = useCallback(
    (appId: string, e: React.MouseEvent, tabId?: string) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      openWindowWithZoom(appId, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
      if (tabId) setActiveTab(appId, tabId);
      onClose();
    },
    [openWindowWithZoom, setActiveTab, onClose],
  );

  if (!isOpen) return null;

  const categoryTop = (cat: StartMenuCategory): number => {
    const row = categoryRowRefs.current.get(cat);
    const menu = menuRef.current;
    if (!row || !menu) return 0;
    return row.getBoundingClientRect().top - menu.getBoundingClientRect().top;
  };

  const appTop = (appId: string): number => {
    const row = appRowRefs.current.get(appId);
    const menu = menuRef.current;
    if (!row || !menu) return 0;
    return row.getBoundingClientRect().top - menu.getBoundingClientRect().top;
  };

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 z-10"
      onPointerMove={(e) => {
        catHover.onContainerMove(e);
        appHover.onContainerMove(e);
      }}
    >
      {/* Category column — pixel-rounded on its own so the clip-path
          doesn't swallow the absolute-positioned fly-outs below. */}
      <div
        className="pixel-rounded-sm pixel-shadow-floating flex flex-col min-w-0 bg-page pb-1"
        style={{ width: COLUMN_WIDTH_PX }}
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => {
              categoryRowRefs.current.set(cat.id, el);
            }}
          >
            <MenuRow
              icon={cat.icon}
              label={cat.label}
              hasChildren
              highlighted={catHover.active === cat.id}
              onPointerEnter={(e) => {
                catHover.onItemEnter(cat.id, e);
                appHover.reset();
              }}
            />
          </div>
        ))}
      </div>

      {/* Level 1 submenu: apps (or links) in the active category */}
        {activeCategory && (
          <SubmenuPanel
            left={COLUMN_WIDTH_PX}
            top={categoryTop(activeCategory.id)}
            registerEl={catHover.registerSubmenu}
          >
            {activeCategory.links ? (
              <LinksList
                links={activeCategory.links}
                onPointerEnterAny={() => appHover.reset()}
              />
            ) : (
              <div className="py-1">
                {activeCategory.apps.map((app) => {
                  const key: AppHoverKey = `${activeCategory.id}:${app.id}`;
                  return (
                    <div
                      key={app.id}
                      ref={(el) => {
                        appRowRefs.current.set(app.id, el);
                      }}
                    >
                      <MenuRow
                        icon={app.icon}
                        label={app.label}
                        hasChildren={Boolean(app.subtabs?.length)}
                        highlighted={appHover.active === key}
                        onClick={(e) => launch(app.id, e)}
                        onPointerEnter={(e) => {
                          if (app.subtabs?.length) {
                            appHover.onItemEnter(key, e);
                          } else {
                            appHover.reset();
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </SubmenuPanel>
        )}

        {/* Level 2 submenu: subtabs for the hovered app */}
        {activeCategory && activeApp?.subtabs && (
          <SubmenuPanel
            left={COLUMN_WIDTH_PX * 2}
            top={appTop(activeApp.id)}
            registerEl={appHover.registerSubmenu}
          >
            <div className="py-1">
              {activeApp.subtabs.map((sub: AppSubtab) => (
                <MenuRow
                  key={sub.id}
                  icon={sub.icon ?? <Icon name="chevron-right" />}
                  label={sub.label}
                  onClick={(e) => launch(activeApp.id, e, sub.id)}
                />
              ))}
            </div>
          </SubmenuPanel>
        )}
    </div>
  );
}

// ============================================================================
// Submenu panel + links list
// ============================================================================

function SubmenuPanel({
  left,
  top,
  registerEl,
  children,
}: {
  left: number;
  top: number;
  registerEl: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  // Outer wrapper owns the absolute positioning; inner applies pixel-rounded
  // (which sets its own `position: relative` and would otherwise clobber
  // `absolute` via CSS layer ordering, dropping the panel back into flow).
  return (
    <div
      ref={registerEl}
      className="absolute"
      style={{ left, top, width: COLUMN_WIDTH_PX }}
    >
      <div className="pixel-rounded-sm pixel-shadow-floating bg-page">
        {children}
      </div>
    </div>
  );
}

function LinksList({
  links,
  onPointerEnterAny,
}: {
  links: StartMenuLink[];
  onPointerEnterAny: () => void;
}) {
  return (
    <div className="py-1">
      {links.map((link) => (
        <MenuRow
          key={link.id}
          icon={link.icon}
          label={link.label}
          href={link.href}
          onPointerEnter={onPointerEnterAny}
        />
      ))}
    </div>
  );
}

export default StartMenu;
