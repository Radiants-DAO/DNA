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

function Nav({ className = '' }: { className?: string }): React.ReactElement {
  const { activeValue, setActiveValue, pauseAutoAdvance, items, fillRef } = useStepper();

  return (
    <div className={`flex-shrink-0 flex flex-col w-fit ${className}`}>
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
      <ul className="flex flex-col gap-1 list-none mt-3 p-0" role="tablist">
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
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-xs cursor-pointer text-left border transition-all duration-200 ease-out ${
                  isActive
                    ? 'bg-surface-elevated border-edge-muted'
                    : 'bg-transparent border-transparent hover:bg-surface-elevated/50'
                }`}
                onClick={() => { pauseAutoAdvance(); setActiveValue(item.value); }}
              >
                {item.icon && (
                  <span className={`flex-shrink-0 transition-colors duration-300 ease-out ${
                    isActive ? 'text-action-primary' : 'text-content-muted'
                  }`}>
                    {item.icon}
                  </span>
                )}
                <p
                  className={`font-heading text-xs leading-none tracking-tight uppercase whitespace-nowrap transition-colors duration-300 ease-out ${
                    isActive ? 'text-action-primary' : 'text-content-muted'
                  }`}
                >
                  <span
                    className={`transition-colors duration-300 ease-out ${
                      isActive ? 'text-content-primary' : 'text-content-muted'
                    }`}
                  >
                    {item.number}{' '}
                  </span>
                  {item.label}
                </p>
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

function Panels({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  const { activeValue, setActiveValue, pauseAutoAdvance, items } = useStepper();
  const scrollCooldownRef = useRef(false);
  const panelsRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollCooldownRef.current) return;
    const threshold = 30;
    if (Math.abs(e.deltaY) < threshold) return;

    // Find the active panel's scroll container
    const panelsEl = panelsRef.current;
    if (!panelsEl) return;
    const activePanel = panelsEl.querySelector('[role="tabpanel"]:not(.invisible)');
    const scrollContainer = activePanel?.querySelector('.overflow-auto') as HTMLElement | null;

    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Only switch tabs when scrolled to the edge
      if (e.deltaY > 0 && !atBottom) return;
      if (e.deltaY < 0 && !atTop) return;
    }

    pauseAutoAdvance();
    scrollCooldownRef.current = true;
    setTimeout(() => { scrollCooldownRef.current = false; }, 400);

    const idx = items.findIndex(item => item.value === activeValue);
    if (e.deltaY > 0 && idx < items.length - 1) {
      setActiveValue(items[idx + 1].value);
    } else if (e.deltaY < 0 && idx > 0) {
      setActiveValue(items[idx - 1].value);
    }
  }, [activeValue, setActiveValue, pauseAutoAdvance, items]);

  return (
    <div
      ref={panelsRef}
      className={`relative flex-1 h-full min-w-0 ${className}`}
      onWheel={handleWheel}
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
  const item = items.find(i => i.value === value);

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
        className={`flex flex-col h-full w-full py-4 bg-surface-elevated border border-edge-muted rounded-md transition-colors duration-200 ease-out ${className}`}
      >
        {/* Card header — badge dot + step label */}
        {item && (
          <div className="flex flex-row items-center justify-between px-4 gap-1.5">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="size-2 rounded-full bg-action-primary flex-shrink-0" />
              <p className="whitespace-nowrap font-heading text-xs leading-none tracking-tight uppercase text-content-primary">
                {item.number} - {item.label}
              </p>
            </div>
          </div>
        )}

        {/* Card content */}
        <div className="flex flex-col gap-4 px-4 flex-1 min-h-0 overflow-auto mt-2">
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
