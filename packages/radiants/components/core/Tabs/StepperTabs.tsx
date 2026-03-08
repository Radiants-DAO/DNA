'use client';

import React, { createContext, use, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface StepperItem {
  value: string;
  label: string;
  number: string;
  icon?: React.ReactNode;
}

interface StepperContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  pauseAutoAdvance: () => void;
  items: StepperItem[];
  fillRef: React.RefObject<HTMLDivElement | null>;
}

interface RootProps {
  /** Step definitions — each needs a unique value, display label, and step number */
  items: StepperItem[];
  /** Initial active step (uncontrolled) */
  defaultValue?: string;
  /** Active step (controlled) */
  value?: string;
  /** Callback when active step changes */
  onValueChange?: (value: string) => void;
  /** Enable auto-advance between steps */
  autoAdvance?: boolean;
  /** Time per step in ms (0 disables auto-advance) */
  stepDuration?: number;
  children: React.ReactNode;
  className?: string;
}

interface PanelProps {
  /** Must match a value from the items array */
  value: string;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const StepperContext = createContext<StepperContextValue | null>(null);

function useStepper(): StepperContextValue {
  const ctx = use(StepperContext);
  if (!ctx) throw new Error('StepperTabs: components must be used within StepperTabs.Root');
  return ctx;
}

// ============================================================================
// Root — flex layout + auto-advance engine
// ============================================================================

function Root({
  items,
  defaultValue,
  value,
  onValueChange,
  autoAdvance = false,
  stepDuration = 0,
  children,
  className = '',
}: RootProps): React.ReactElement {
  const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.value || '');
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const setActiveValue = useCallback((v: string) => {
    if (!isControlled) setInternalValue(v);
    onValueChange?.(v);
  }, [isControlled, onValueChange]);

  // Paused state — user interaction stops auto-advance permanently
  const [paused, setPaused] = useState(false);
  const pauseAutoAdvance = useCallback(() => setPaused(true), []);

  // Refs for the rAF loop — avoids stale closures and per-frame re-renders
  const fillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const activeValueRef = useRef(activeValue);
  const setActiveValueRef = useRef(setActiveValue);
  const itemsRef = useRef(items);
  activeValueRef.current = activeValue;
  setActiveValueRef.current = setActiveValue;
  itemsRef.current = items;

  useEffect(() => {
    if (!autoAdvance || stepDuration <= 0 || paused) return;

    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = performance.now();
    if (fillRef.current) fillRef.current.style.width = '0%';

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / stepDuration) * 100, 100);
      if (fillRef.current) fillRef.current.style.width = `${pct}%`;

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const currentItems = itemsRef.current;
        const idx = currentItems.findIndex(item => item.value === activeValueRef.current);
        const next = (idx + 1) % currentItems.length;
        setActiveValueRef.current(currentItems[next].value);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeValue, autoAdvance, stepDuration, paused]);

  return (
    <StepperContext value={{ activeValue, setActiveValue, pauseAutoAdvance, items, fillRef }}>
      <div className={`flex gap-4 items-start w-full h-full ${className}`}>
        {children}
      </div>
    </StepperContext>
  );
}

// ============================================================================
// Nav — dot pill + sidebar labels (left column, flex-shrink)
// ============================================================================

function Nav({ children, className = '' }: { children?: React.ReactNode; className?: string }): React.ReactElement {
  const { activeValue, setActiveValue, pauseAutoAdvance, items, fillRef } = useStepper();

  return (
    <div className={`flex-shrink-0 flex flex-col justify-between h-full w-fit bg-surface-elevated border border-edge-primary rounded-md p-3 ${className}`}>
      {/* Slot for custom content above nav */}
      {children}

      {/* Dot nav pill */}
      <div className="relative flex flex-row items-center justify-center w-fit h-4 py-0.5 px-1 gap-1 border border-edge-muted rounded-xs">
        {items.map((item) => {
          const isActive = activeValue === item.value;
          return (
            <button
              key={item.value}
              type="button"
              className={`flex items-center justify-center p-0 border-none bg-transparent cursor-pointer transition-all duration-300 ease-out ${
                isActive ? 'w-8 h-2' : 'size-2'
              }`}
              aria-label={`Go to ${item.label}`}
              onClick={() => { pauseAutoAdvance(); setActiveValue(item.value); }}
            >
              <div
                className={`relative overflow-hidden rounded-xs flex-shrink-0 w-full h-full ${
                  isActive ? 'bg-edge-primary' : 'bg-content-muted'
                }`}
              >
                {isActive && (
                  <div
                    ref={fillRef}
                    className="absolute top-0 left-0 h-full bg-action-primary"
                    style={{ width: '0%' }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sidebar labels */}
      <ul className="flex flex-col gap-0 list-none mt-auto p-0" role="tablist">
        {items.map((item) => {
          const isActive = activeValue === item.value;
          return (
            <li key={item.value} className="flex">
              <button
                type="button"
                id={`stepper-tab-${item.value}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`stepper-panel-${item.value}`}
                className={`flex items-center gap-2 w-full h-5 px-1.5 rounded-xs cursor-pointer text-left border transition-all duration-200 ease-out ${
                  isActive
                    ? 'bg-surface-elevated text-content-primary border-edge-primary'
                    : 'bg-transparent border-transparent hover:bg-surface-elevated/50'
                }`}
                onClick={() => { pauseAutoAdvance(); setActiveValue(item.value); }}
              >
                <p
                  className={`flex-1 font-heading text-xs leading-none tracking-tight uppercase whitespace-nowrap transition-colors duration-300 ease-out ${
                    isActive ? 'text-content-primary' : 'text-content-muted'
                  }`}
                >
                  {item.label}
                </p>
                {item.icon && (
                  <>
                    <span className="flex-1 h-0 border-t border-edge-muted" />
                    <span className={`flex-shrink-0 transition-colors duration-300 ease-out ${
                      isActive ? 'text-content-primary' : 'text-content-muted'
                    }`}>
                      {item.icon}
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================================================
// Panels — stacked card container (flex-grow)
// ============================================================================

// Shared edge detection for scroll containers found via [data-scroll-container]
function isAtScrollEdge(container: HTMLElement | null, direction: 'up' | 'down'): boolean {
  if (!container) return true;
  const { scrollTop, scrollHeight, clientHeight } = container;
  if (scrollHeight <= clientHeight + 1) return true; // content doesn't overflow
  if (direction === 'down') return scrollTop + clientHeight >= scrollHeight - 1;
  return scrollTop <= 0;
}

function findScrollContainer(panelsEl: HTMLElement): HTMLElement | null {
  const activePanel = panelsEl.querySelector('[role="tabpanel"]:not(.invisible)');
  return activePanel?.querySelector('[data-scroll-container]') as HTMLElement | null;
}

const OVERSCROLL_THRESHOLD = 600;
const SWITCH_COOLDOWN_MS = 600;
const SWIPE_THRESHOLD_PX = 50;
const MAX_RUBBER_BAND_PX = 40;

// Diminishing-return curve: pulls hard at first, then resists
function rubberBand(accumulated: number, threshold: number): number {
  const t = Math.min(accumulated / threshold, 1);
  return MAX_RUBBER_BAND_PX * (1 - Math.pow(1 - t, 3)); // ease-out cubic
}

function Panels({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  const { activeValue, setActiveValue, pauseAutoAdvance, items } = useStepper();
  const panelsRef = useRef<HTMLDivElement>(null);

  // Wheel (desktop/trackpad) — overscroll accumulator
  const overscrollRef = useRef(0);
  const overscrollDirRef = useRef<'up' | 'down' | null>(null);
  const decayTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const cooldownRef = useRef(false);

  // Touch (mobile) — swipe gesture + live tracking
  const touchRef = useRef<{ y: number; atTop: boolean; atBottom: boolean } | null>(null);
  const touchOverscrollRef = useRef(0);

  useEffect(() => {
    return () => clearTimeout(decayTimerRef.current);
  }, []);

  // Apply rubber-band translateY directly to the active panel (no re-render)
  const applyRubberBand = useCallback((px: number) => {
    const panelsEl = panelsRef.current;
    if (!panelsEl) return;
    const activePanel = panelsEl.querySelector('[role="tabpanel"]:not(.invisible)') as HTMLElement | null;
    if (!activePanel) return;
    if (px === 0) {
      activePanel.style.transform = '';
      activePanel.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0, 1)';
      // Let the transition play, then clear inline styles
      const handler = () => { activePanel.style.transition = ''; activePanel.style.transform = ''; };
      activePanel.addEventListener('transitionend', handler, { once: true });
    } else {
      activePanel.style.transition = '';
      activePanel.style.transform = `translateY(${px}px)`;
    }
  }, []);

  const resetOverscroll = useCallback(() => {
    overscrollRef.current = 0;
    overscrollDirRef.current = null;
    applyRubberBand(0);
  }, [applyRubberBand]);

  const advance = useCallback((direction: 'up' | 'down') => {
    pauseAutoAdvance();
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, SWITCH_COOLDOWN_MS);
    applyRubberBand(0);

    const idx = items.findIndex(item => item.value === activeValue);
    if (direction === 'down' && idx < items.length - 1) {
      setActiveValue(items[idx + 1].value);
    } else if (direction === 'up' && idx > 0) {
      setActiveValue(items[idx - 1].value);
    }
  }, [activeValue, setActiveValue, pauseAutoAdvance, items, applyRubberBand]);

  // ---- Wheel (desktop) ----
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (cooldownRef.current || Math.abs(e.deltaY) < 5) return;
    const panelsEl = panelsRef.current;
    if (!panelsEl) return;

    const direction: 'up' | 'down' = e.deltaY > 0 ? 'down' : 'up';
    if (!isAtScrollEdge(findScrollContainer(panelsEl), direction)) {
      if (overscrollRef.current > 0) resetOverscroll();
      return;
    }

    if (overscrollDirRef.current && overscrollDirRef.current !== direction) {
      overscrollRef.current = 0;
    }
    overscrollDirRef.current = direction;
    overscrollRef.current += Math.abs(e.deltaY);

    // Visual feedback — pull in the opposite direction of scroll
    const displacement = rubberBand(overscrollRef.current, OVERSCROLL_THRESHOLD);
    applyRubberBand(direction === 'down' ? -displacement : displacement);

    clearTimeout(decayTimerRef.current);
    decayTimerRef.current = setTimeout(resetOverscroll, 800);

    if (overscrollRef.current >= OVERSCROLL_THRESHOLD) {
      overscrollRef.current = 0;
      overscrollDirRef.current = null;
      advance(direction);
    }
  }, [advance, applyRubberBand, resetOverscroll]);

  // ---- Touch (mobile) ----
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const panelsEl = panelsRef.current;
    if (!panelsEl) return;
    const sc = findScrollContainer(panelsEl);
    touchRef.current = {
      y: e.touches[0].clientY,
      atTop: isAtScrollEdge(sc, 'up'),
      atBottom: isAtScrollEdge(sc, 'down'),
    };
    touchOverscrollRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current || cooldownRef.current) return;
    const deltaY = touchRef.current.y - e.touches[0].clientY;
    const { atTop, atBottom } = touchRef.current;

    // Swiping up (positive delta) while at bottom, or swiping down (negative) while at top
    const isOverscrolling = (deltaY > 0 && atBottom) || (deltaY < 0 && atTop);
    if (!isOverscrolling) {
      if (touchOverscrollRef.current !== 0) {
        touchOverscrollRef.current = 0;
        applyRubberBand(0);
      }
      return;
    }

    touchOverscrollRef.current = Math.abs(deltaY);
    const displacement = rubberBand(touchOverscrollRef.current, OVERSCROLL_THRESHOLD);
    applyRubberBand(deltaY > 0 ? -displacement : displacement);
  }, [applyRubberBand]);

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current || cooldownRef.current) {
      touchRef.current = null;
      return;
    }
    const accumulated = touchOverscrollRef.current;
    const { atTop, atBottom } = touchRef.current;
    touchRef.current = null;
    touchOverscrollRef.current = 0;

    if (accumulated >= SWIPE_THRESHOLD_PX) {
      // Determine direction from the last known overscroll context
      if (atBottom) advance('down');
      else if (atTop) advance('up');
      else applyRubberBand(0);
    } else {
      applyRubberBand(0);
    }
  }, [advance, applyRubberBand]);

  return (
    <div
      ref={panelsRef}
      className={`relative flex-1 h-full min-w-0 ${className}`}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Panel — individual card (instant switch, no animation)
// ============================================================================

function Panel({ value, children, className = '' }: PanelProps): React.ReactElement {
  const { activeValue, items } = useStepper();
  const isActive = activeValue === value;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  const idx = items.findIndex(item => item.value === value);
  const hasNext = idx < items.length - 1;

  const checkScroll = useCallback(() => {
    setAtBottom(isAtScrollEdge(scrollRef.current, 'down'));
  }, []);

  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(checkScroll);
    } else {
      setAtBottom(false);
    }
  }, [isActive, checkScroll]);

  const showHint = isActive && atBottom && hasNext;

  return (
    <div
      id={`stepper-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`stepper-tab-${value}`}
      className={`absolute inset-0 ${
        isActive
          ? 'visible pointer-events-auto z-30'
          : 'invisible pointer-events-none z-0'
      }`}
    >
      <div
        className={`@container flex flex-col h-full w-full bg-surface-elevated border border-edge-primary rounded-md ${className}`}
      >
        <div
          ref={scrollRef}
          data-scroll-container
          className="flex-1 min-h-0 overflow-auto p-2"
          style={{ maxHeight: 'var(--app-content-max-height)' }}
          onScroll={checkScroll}
        >
          {children}
        </div>
        {showHint && (
          <div className="flex items-center justify-center gap-2 py-1 border-t border-edge-muted">
            <span className="font-heading text-xs text-content-muted uppercase tracking-tight leading-none">
              Scroll to continue to next page
            </span>
            <span className="text-content-muted text-xs">↓</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PanelTitle — card heading
// ============================================================================

function PanelTitle({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <h2 className={`text-content-heading font-normal text-2xl leading-none tracking-normal ${className}`}>
      {children}
    </h2>
  );
}

// ============================================================================
// PanelBody — card description text
// ============================================================================

function PanelBody({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <p className={`font-heading text-sm leading-snug tracking-tight text-content-muted ${className}`}>
      {children}
    </p>
  );
}

// ============================================================================
// Public API
// ============================================================================

export type { StepperItem };

export const StepperTabs = {
  Root,
  Nav,
  Panels,
  Panel,
  PanelTitle,
  PanelBody,
};

export default StepperTabs;
