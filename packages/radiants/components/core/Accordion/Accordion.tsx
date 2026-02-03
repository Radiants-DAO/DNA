'use client';

import React, { createContext, use, useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

type AccordionType = 'single' | 'multiple';

interface AccordionState {
  expandedItems: Set<string>;
}

interface AccordionActions {
  toggleItem: (value: string) => void;
}

interface AccordionMeta {
  type: AccordionType;
}

interface AccordionContextValue {
  state: AccordionState;
  actions: AccordionActions;
  meta: AccordionMeta;
}

interface AccordionItemContextValue {
  value: string;
  isExpanded: boolean;
}

// ============================================================================
// Context
// ============================================================================

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionContext(): AccordionContextValue {
  const context = use(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion.Provider');
  }
  return context;
}

function useAccordionItemContext(): AccordionItemContextValue {
  const context = use(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger/AccordionContent must be used within an Accordion.Item');
  }
  return context;
}

// ============================================================================
// Provider — thin DI passthrough, no internal state
// ============================================================================

interface ProviderProps {
  state: AccordionState;
  actions: AccordionActions;
  meta: AccordionMeta;
  children: React.ReactNode;
}

function Provider({ state, actions, meta, children }: ProviderProps): React.ReactNode {
  return (
    <AccordionContext value={{ state, actions, meta }}>
      {children}
    </AccordionContext>
  );
}

// ============================================================================
// Frame — wrapper div
// ============================================================================

interface FrameProps {
  children: React.ReactNode;
  className?: string;
}

function Frame({ children, className = '' }: FrameProps): React.ReactNode {
  return <div className={`space-y-0 ${className}`}>{children}</div>;
}

// ============================================================================
// Item
// ============================================================================

interface ItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

function Item({ value, className = '', children }: ItemProps): React.ReactNode {
  const { state } = useAccordionContext();
  const isExpanded = state.expandedItems.has(value);

  return (
    <AccordionItemContext value={{ value, isExpanded }}>
      <div
        className={`
          border border-edge-primary
          bg-surface-primary
          -mt-px first:mt-0
          ${className}
        `.trim()}
        data-state={isExpanded ? 'open' : 'closed'}
      >
        {children}
      </div>
    </AccordionItemContext>
  );
}

// ============================================================================
// Trigger
// ============================================================================

interface TriggerProps {
  className?: string;
  children: React.ReactNode;
}

function Trigger({ className = '', children }: TriggerProps): React.ReactNode {
  const { actions } = useAccordionContext();
  const { value, isExpanded } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => actions.toggleItem(value)}
      className={`
        w-full flex items-center justify-between
        px-4 py-3
        font-joystix text-sm uppercase text-content-primary
        bg-transparent
        hover:bg-content-primary/5
        transition-colors
        cursor-pointer
        ${className}
      `.trim()}
      aria-expanded={isExpanded}
    >
      <span>{children}</span>
      <span
        className="text-[1rem] font-mondwest select-none"
        aria-hidden="true"
      >
        {isExpanded ? '−' : '+'}
      </span>
    </button>
  );
}

// ============================================================================
// Content
// ============================================================================

interface ContentProps {
  className?: string;
  children: React.ReactNode;
}

function Content({ className = '', children }: ContentProps): React.ReactNode {
  const { isExpanded } = useAccordionItemContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (isExpanded) {
      const scrollHeight = content.scrollHeight;
      setHeight(scrollHeight);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setHeight(undefined);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      const scrollHeight = content.scrollHeight;
      setHeight(scrollHeight);
      setIsAnimating(true);

      requestAnimationFrame(() => {
        setHeight(0);
      });

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const resolvedHeight = isAnimating ? height : (isExpanded ? 'auto' : 0);

  return (
    <div
      ref={contentRef}
      className={`
        overflow-hidden
        transition-[height] duration-200 ease-out
        ${className}
      `.trim()}
      style={{ height: resolvedHeight }}
      aria-hidden={!isExpanded}
    >
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Accordion — plain object composition
// ============================================================================

export function useAccordionState({
  type = 'single' as AccordionType,
  defaultValue,
  value: controlledValue,
  onValueChange,
}: {
  type?: AccordionType;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
} = {}): { state: AccordionState; actions: AccordionActions; meta: AccordionMeta } {
  const getInitialExpanded = (): Set<string> => {
    const initial = controlledValue ?? defaultValue;
    if (!initial) return new Set();
    return new Set(Array.isArray(initial) ? initial : [initial]);
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(getInitialExpanded);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setExpandedItems(new Set(Array.isArray(controlledValue) ? controlledValue : [controlledValue]));
    }
  }, [controlledValue]);

  const toggleItem = useCallback((itemValue: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemValue)) {
        next.delete(itemValue);
      } else {
        if (type === 'single') next.clear();
        next.add(itemValue);
      }
      if (onValueChange) {
        const newValue = Array.from(next);
        onValueChange(type === 'single' ? (newValue[0] ?? '') : newValue);
      }
      return next;
    });
  }, [type, onValueChange]);

  return {
    state: { expandedItems },
    actions: { toggleItem },
    meta: { type },
  };
}

export const Accordion = {
  Provider,
  Frame,
  Item,
  Trigger,
  Content,
  useAccordionState,
};

export default Accordion;
