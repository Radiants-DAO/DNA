'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Safe-triangle hover intent
//
// Drop-in state for hover menus that need forgiveness when the pointer moves
// diagonally from a trigger into its open submenu. Pattern: XP / Amazon mega-
// menu safe area.
//
// How to use
// ──────────
// const hover = useSafeHover<'tools' | 'media'>();
//
// <div onPointerMove={hover.onContainerMove}>         // root that owns the menu
//   {triggers.map((t) => (
//     <button
//       data-active={hover.active === t.id}
//       onPointerEnter={(e) => hover.onItemEnter(t.id, e)}
//     />
//   ))}
//   {hover.active && (
//     <div ref={hover.registerSubmenu}>…submenu…</div>
//   )}
// </div>
//
// Compose two instances for two-level cascades (category → app → subtabs). Call
// `reset()` to drop state when the whole menu closes.
// ============================================================================

export interface PointerPoint {
  x: number;
  y: number;
}

export function pointInTriangle(
  p: PointerPoint,
  a: PointerPoint,
  b: PointerPoint,
  c: PointerPoint,
): boolean {
  const sign = (p1: PointerPoint, p2: PointerPoint, p3: PointerPoint) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export interface UseSafeHoverOptions {
  /** Max time (ms) the switch is delayed while the pointer is still aiming at
   *  the open submenu. Commits after this even if the pointer never arrives. */
  delayMs?: number;
}

export interface UseSafeHoverReturn<K extends string> {
  active: K | null;
  setActive: (key: K | null) => void;
  onItemEnter: (key: K, e: React.PointerEvent) => void;
  onContainerMove: (e: React.PointerEvent) => void;
  registerSubmenu: (el: HTMLElement | null) => void;
  reset: () => void;
}

interface PendingHover<K extends string> {
  key: K;
  timer: ReturnType<typeof setTimeout>;
  enterPoint: PointerPoint;
}

export function useSafeHover<K extends string = string>(
  options: UseSafeHoverOptions = {},
): UseSafeHoverReturn<K> {
  const { delayMs = 400 } = options;
  const [active, setActive] = useState<K | null>(null);
  const pendingRef = useRef<PendingHover<K> | null>(null);
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
    (key: K, e: React.PointerEvent) => {
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
      }, delayMs);
      pendingRef.current = { key, timer, enterPoint };
    },
    [active, delayMs],
  );

  const onContainerMove = useCallback((e: React.PointerEvent) => {
    const pending = pendingRef.current;
    const submenu = submenuElRef.current;
    if (!pending || !submenu) return;
    const rect = submenu.getBoundingClientRect();
    const p: PointerPoint = { x: e.clientX, y: e.clientY };

    // Pointer reached the current submenu — user was aiming at it all along.
    // Cancel the pending switch so the timer can't yank it out from under them.
    const insideSubmenu =
      p.x >= rect.left && p.x <= rect.right &&
      p.y >= rect.top && p.y <= rect.bottom;
    if (insideSubmenu) {
      clearTimeout(pending.timer);
      pendingRef.current = null;
      return;
    }

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
