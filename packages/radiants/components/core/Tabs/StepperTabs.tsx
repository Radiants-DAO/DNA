'use client';

import React, { createContext, use, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface StepperItem {
  value: string;
  label: string;
  number: string;
}

interface StepperContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
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
// Root — outer grid + auto-advance engine
// ============================================================================

function Root({
  items,
  defaultValue,
  value,
  onValueChange,
  autoAdvance = true,
  stepDuration = 4000,
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
    if (!autoAdvance || stepDuration <= 0) return;

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
  }, [activeValue, autoAdvance, stepDuration]);

  return (
    <StepperContext value={{ activeValue, setActiveValue, items, fillRef }}>
      <div className={`grid grid-cols-6 gap-6 items-end w-full ${className}`}>
        {children}
      </div>
    </StepperContext>
  );
}

// ============================================================================
// Nav — dot pill + sidebar labels (left column)
// ============================================================================

function Nav({ className = '' }: { className?: string }): React.ReactElement {
  const { activeValue, setActiveValue, items, fillRef } = useStepper();

  return (
    <div className={`col-span-2 flex flex-col mt-auto w-fit max-w-fit ${className}`}>
      {/* Dot nav pill */}
      <div className="relative flex flex-row items-center justify-center w-fit h-4 py-0.5 px-1 gap-1 border border-edge-muted rounded-full">
        {items.map((item) => {
          const isActive = activeValue === item.value;
          return (
            <button
              key={item.value}
              type="button"
              className="flex items-center justify-center size-2 p-0 border-none bg-transparent cursor-pointer"
              aria-label={`Go to ${item.label}`}
              onClick={() => setActiveValue(item.value)}
            >
              <div
                className={`relative overflow-hidden rounded-full flex-shrink-0 transition-all duration-300 ease-out ${
                  isActive
                    ? 'w-8 h-2 bg-edge-primary'
                    : 'size-2 bg-content-muted aspect-square'
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
      <ul className="flex flex-col gap-1.5 list-none mt-4 p-0" role="tablist">
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
                className="bg-transparent border-none p-0 cursor-pointer text-left transition-opacity duration-200 ease-out hover:opacity-80"
                onClick={() => setActiveValue(item.value)}
              >
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
// Panels — stacked card container (right column)
// ============================================================================

function Panels({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <div className={`relative min-h-80 col-span-4 col-start-3 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// Panel — individual card with fade + slide transition
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
      className={`absolute bottom-0 inset-x-0 ${
        isActive
          ? 'opacity-100 translate-y-0 visible pointer-events-auto z-30'
          : 'opacity-0 translate-y-8 invisible pointer-events-none z-0'
      }`}
      style={{
        transition: 'opacity 300ms ease-out, transform 300ms ease-out, visibility 0ms',
        transitionDelay: isActive ? '0ms' : '0ms, 0ms, 300ms',
      }}
    >
      <div
        className={`flex flex-col min-h-80 w-full py-4 bg-surface-elevated border border-edge-muted rounded-md transition-colors duration-200 ease-out ${className}`}
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
        <div className="flex flex-col gap-4 px-4 mt-auto">
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
