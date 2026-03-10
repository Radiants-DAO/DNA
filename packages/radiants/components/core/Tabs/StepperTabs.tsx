'use client';

import React, { createContext, use, useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '../Button/Button';

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
  scrollToPanel: (value: string) => void;
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

  // Scroll only the Panels container — not the whole page
  const scrollToPanel = useCallback((v: string) => {
    const container = document.querySelector('[data-stepper-scroll]') as HTMLElement | null;
    if (!container) return;
    const panels = container.querySelectorAll('[data-panel-value]');
    const idx = Array.from(panels).findIndex(p => (p as HTMLElement).dataset.panelValue === v);
    if (idx >= 0) {
      container.scrollTo({ top: idx * container.clientHeight, behavior: 'smooth' });
    }
  }, []);

  // Paused state — user interaction stops auto-advance permanently
  const [paused, setPaused] = useState(false);
  const pauseAutoAdvance = useCallback(() => setPaused(true), []);

  // Refs for the rAF loop — avoids stale closures and per-frame re-renders
  const fillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const activeValueRef = useRef(activeValue);
  const scrollToPanelRef = useRef(scrollToPanel);
  const itemsRef = useRef(items);
  activeValueRef.current = activeValue;
  scrollToPanelRef.current = scrollToPanel;
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
        scrollToPanelRef.current(currentItems[next].value);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeValue, autoAdvance, stepDuration, paused]);

  return (
    <StepperContext value={{ activeValue, setActiveValue, scrollToPanel, pauseAutoAdvance, items, fillRef }}>
      <div className={`flex items-start w-full h-full ${className}`}>
        {children}
      </div>
    </StepperContext>
  );
}

// ============================================================================
// Nav — dot pill + sidebar labels (left column, flex-shrink)
// ============================================================================

function Nav({ children, className = '' }: { children?: React.ReactNode; className?: string }): React.ReactElement {
  const { activeValue, scrollToPanel, pauseAutoAdvance, items, fillRef } = useStepper();

  return (
    <div className={`flex-shrink-0 flex flex-col justify-between h-full w-fit bg-surface-elevated border border-edge-primary rounded-l-sm ${className}`}>
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
              onClick={() => { pauseAutoAdvance(); scrollToPanel(item.value); }}
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

      {/* Sidebar labels — inverted theme wrapper */}
      <div className="p-1 rounded-xs mt-auto" data-nav-invert>
        <ul className="flex flex-col gap-0 list-none p-0" role="tablist">
          {items.map((item) => {
            const isActive = activeValue === item.value;
            return (
              <li key={item.value} className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  active={isActive}
                  icon={item.icon}
                  role="tab"
                  id={`stepper-tab-${item.value}`}
                  aria-selected={isActive}
                  aria-controls={`stepper-panel-${item.value}`}
                  onClick={() => { pauseAutoAdvance(); scrollToPanel(item.value); }}
                >
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Panels — vertical scroll-snap container
// ============================================================================

function Panels({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  const { setActiveValue, pauseAutoAdvance, items } = useStepper();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync active tab from scroll position via IntersectionObserver
  // User-initiated scrolls pause auto-advance; programmatic scrolls don't
  const isUserScrollRef = useRef(true);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Any direct user interaction marks scrolls as user-initiated
    const markUser = () => { isUserScrollRef.current = true; };
    container.addEventListener('wheel', markUser, { passive: true });
    container.addEventListener('touchstart', markUser, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const panelValue = (entry.target as HTMLElement).dataset.panelValue;
            if (panelValue) {
              if (isUserScrollRef.current) pauseAutoAdvance();
              setActiveValue(panelValue);
              isUserScrollRef.current = false;
            }
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    const panels = container.querySelectorAll('[data-panel-value]');
    panels.forEach((panel) => observer.observe(panel));
    return () => {
      observer.disconnect();
      container.removeEventListener('wheel', markUser);
      container.removeEventListener('touchstart', markUser);
    };
  }, [setActiveValue, pauseAutoAdvance, items]);

  return (
    <div
      ref={scrollRef}
      data-stepper-scroll
      className={`flex-1 h-full min-w-0 overflow-y-auto snap-y snap-mandatory overscroll-contain bg-surface-elevated border border-edge-primary border-l-0 rounded-r-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Panel — full-height snap section
// ============================================================================

function Panel({ value, children, className = '' }: PanelProps): React.ReactElement {
  return (
    <div
      id={`stepper-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`stepper-tab-${value}`}
      data-panel-value={value}
      className="snap-start snap-always h-full flex-shrink-0 overflow-hidden"
    >
      <div
        className={`@container flex flex-col h-full w-full ${className}`}
      >
        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
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
