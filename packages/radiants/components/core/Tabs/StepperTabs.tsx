'use client';

import React, { createContext, use, useState, useCallback, useRef, useEffect, useId } from 'react';
import { Button } from '../Button/Button';

// ============================================================================
// Types
// ============================================================================

interface StepperItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface StepperContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  handleStepClick: (value: string) => void;
  items: StepperItem[];
  fillRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  idPrefix: string;
}

interface RootProps {
  /** Step definitions — each needs a unique value and display label */
  items: StepperItem[];
  /** Initial active step (uncontrolled) */
  defaultValue?: string;
  /** Active step (controlled) */
  value?: string;
  /** Callback when active step changes */
  onValueChange?: (value: string) => void;
  /** Auto-advance duration in ms (falsy = disabled) */
  autoAdvance?: number | false;
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

  // Shared ref for the Panels scroll container — set by Panels, read by scrollToPanel
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Instance-scoped ID prefix for ARIA attributes
  const idPrefix = useId();

  // Scroll the Panels container to a specific panel by value
  const scrollToPanel = useCallback((v: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const idx = items.findIndex(item => item.value === v);
    if (idx >= 0) {
      container.scrollTo({ top: idx * container.clientHeight, behavior: 'smooth' });
    }
  }, [items]);

  // Paused state — user interaction stops auto-advance permanently
  const [paused, setPaused] = useState(false);
  const pauseAutoAdvance = useCallback(() => setPaused(true), []);

  // Combined click handler for dot nav + sidebar labels
  const handleStepClick = useCallback((v: string) => {
    pauseAutoAdvance();
    scrollToPanel(v);
  }, [pauseAutoAdvance, scrollToPanel]);

  // Refs for the rAF loop — avoids stale closures and per-frame re-renders
  const fillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const activeValueRef = useRef(activeValue);
  const itemsRef = useRef(items);
  activeValueRef.current = activeValue;
  itemsRef.current = items;

  const stepDuration = typeof autoAdvance === 'number' ? autoAdvance : 0;

  useEffect(() => {
    if (!stepDuration || paused) return;

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
        scrollToPanel(currentItems[next].value);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeValue, stepDuration, paused, scrollToPanel]);

  return (
    <StepperContext value={{ activeValue, setActiveValue, handleStepClick, items, fillRef, scrollContainerRef, idPrefix }}>
      <div className={`flex items-start w-full h-full ${className}`}>
        {children}
      </div>
    </StepperContext>
  );
}

// ============================================================================
// Nav — dot pill + sidebar labels (left column, flex-shrink)
// ============================================================================

interface NavProps {
  children?: React.ReactNode;
  className?: string;
  /** Invert theme on the sidebar labels (default: true) */
  invertLabels?: boolean;
}

function Nav({ children, className = '', invertLabels = true }: NavProps): React.ReactElement {
  const { activeValue, handleStepClick, items, fillRef, idPrefix } = useStepper();

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
              onClick={() => handleStepClick(item.value)}
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
      <div className={`p-1 rounded-xs mt-auto${invertLabels ? '' : ''}`} {...(invertLabels ? { 'data-nav-invert': '' } : {})}>
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
                  id={`${idPrefix}-tab-${item.value}`}
                  aria-selected={isActive}
                  aria-controls={`${idPrefix}-panel-${item.value}`}
                  onClick={() => handleStepClick(item.value)}
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
  const { setActiveValue, items, scrollContainerRef } = useStepper();

  // Sync active tab from scroll position via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const panelValue = (entry.target as HTMLElement).dataset.panelValue;
            if (panelValue) {
              setActiveValue(panelValue);
            }
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    const panels = container.querySelectorAll('[data-panel-value]');
    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [setActiveValue, items.length, scrollContainerRef]);

  return (
    <div
      ref={scrollContainerRef}
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
  const { idPrefix } = useStepper();

  return (
    <div
      id={`${idPrefix}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-tab-${value}`}
      data-panel-value={value}
      className={`@container snap-start snap-always h-full flex-shrink-0 overflow-hidden ${className}`}
    >
      <div className="flex-1 min-h-0 overflow-auto h-full">
        {children}
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
