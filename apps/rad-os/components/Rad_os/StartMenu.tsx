'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import {
  getStartMenuCategories,
  type AppSubtab,
  type StartMenuCategory,
  type StartMenuLink,
} from '@/lib/apps';
import { Button } from '@rdna/radiants/components/core';
import { WordmarkLogo, Icon } from '@rdna/radiants/icons/runtime';

// ============================================================================
// Types
// ============================================================================

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type HoverKey = string; // category id, or `${categoryId}:${appId}` for app-level

interface PendingHover {
  key: HoverKey;
  timer: ReturnType<typeof setTimeout>;
  enterPoint: { x: number; y: number };
}

// ============================================================================
// Safe-triangle utility
// ============================================================================

function pointInTriangle(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): boolean {
  const sign = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
  ) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

const HOVER_DELAY_MS = 400;

/**
 * Hover state for a single fly-out level (parent items + one open submenu).
 * Delays switching to a new item while the pointer is still aiming at the
 * currently-open submenu (XP/Amazon "safe area" pattern).
 */
function useSafeHover() {
  const [active, setActive] = useState<HoverKey | null>(null);
  const pendingRef = useRef<PendingHover | null>(null);
  const submenuElRef = useRef<HTMLElement | null>(null);

  const clearPending = () => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }
  };

  const registerSubmenu = useCallback((el: HTMLElement | null) => {
    submenuElRef.current = el;
  }, []);

  const onItemEnter = useCallback(
    (key: HoverKey, e: React.PointerEvent) => {
      if (key === active) {
        clearPending();
        return;
      }
      if (!active || !submenuElRef.current) {
        clearPending();
        setActive(key);
        return;
      }
      clearPending();
      const enterPoint = { x: e.clientX, y: e.clientY };
      const timer = setTimeout(() => {
        setActive(key);
        pendingRef.current = null;
      }, HOVER_DELAY_MS);
      pendingRef.current = { key, timer, enterPoint };
    },
    [active],
  );

  const onContainerMove = useCallback((e: React.PointerEvent) => {
    const pending = pendingRef.current;
    const submenu = submenuElRef.current;
    if (!pending || !submenu) return;
    const rect = submenu.getBoundingClientRect();
    const p = { x: e.clientX, y: e.clientY };
    const aiming = pointInTriangle(
      p,
      pending.enterPoint,
      { x: rect.left, y: rect.top },
      { x: rect.left, y: rect.bottom },
    );
    if (!aiming) {
      clearTimeout(pending.timer);
      setActive(pending.key);
      pendingRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearPending();
    setActive(null);
  }, []);

  useEffect(() => () => clearPending(), []);

  return { active, setActive, onItemEnter, onContainerMove, registerSubmenu, reset };
}

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
  return (
    <Button
      type={href ? undefined : 'button'}
      href={href}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}
      quiet
      fullWidth
      rounded="none"
      size="lg"
      active={highlighted}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      className="gap-3"
    >
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
  const catHover = useSafeHover();
  const appHover = useSafeHover();

  const categoryRowRefs = useRef<Map<StartMenuCategory, HTMLDivElement | null>>(new Map());
  const appRowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const categories = getStartMenuCategories();
  const activeCategory = categories.find((c) => c.id === catHover.active) ?? null;
  const activeApp =
    activeCategory?.apps.find(
      (a) => appHover.active === `${activeCategory.id}:${a.id}`,
    ) ?? null;

  // Close behavior
  useEffect(() => {
    if (!isOpen) return;
    catHover.reset();
    appHover.reset();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reason:reset-on-open-only owner:rad-os expires:2027-01-01 issue:DNA-startmenu
  }, [isOpen, onClose]);

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
      <div className="pixel-rounded-sm pixel-shadow-floating relative">
        <div className="flex flex-row bg-page">
          {/* Left brand strip */}
          <div className="w-10 bg-inv flex items-end justify-center pb-3 shrink-0">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              <WordmarkLogo className="h-3 w-auto" color="cream" />
            </div>
          </div>

          {/* Category column */}
          <div
            className="flex flex-col min-w-0"
            style={{ width: COLUMN_WIDTH_PX }}
          >
            <div className="py-1 flex-1">
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

            {/* Footer */}
            <div className="bg-depth px-3 py-2 border-t border-rule flex items-center justify-between">
              <span className="font-mondwest text-sm text-mute">RadOS v1.0</span>
            </div>
          </div>
        </div>

        {/* Level 1 submenu: apps (or links) in the active category */}
        {activeCategory && (
          <SubmenuPanel
            left={COLUMN_WIDTH_PX + 40 /* brand strip */}
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
                  const key = `${activeCategory.id}:${app.id}`;
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
            left={COLUMN_WIDTH_PX + 40 + COLUMN_WIDTH_PX}
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
  return (
    <div
      ref={registerEl}
      className="absolute pixel-rounded-sm pixel-shadow-floating bg-page"
      style={{ left, top, width: COLUMN_WIDTH_PX }}
    >
      {children}
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
