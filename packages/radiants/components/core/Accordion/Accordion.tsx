'use client';

import React, { createContext, use, useState, useRef, useEffect, useCallback } from 'react';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';

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

// ============================================================================
// Context (for passing Radiants-level state alongside Base UI)
// ============================================================================

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(): AccordionContextValue {
  const context = use(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion.Provider');
  }
  return context;
}

// ============================================================================
// Provider — bridges Radiants state API with Base UI Accordion.Root
// ============================================================================

interface ProviderProps {
  state: AccordionState;
  actions: AccordionActions;
  meta: AccordionMeta;
  children: React.ReactNode;
}

function Provider({ state, actions, meta, children }: ProviderProps): React.ReactNode {
  const baseValue = Array.from(state.expandedItems);

  return (
    <AccordionContext value={{ state, actions, meta }}>
      <BaseAccordion.Root
        value={baseValue}
        onValueChange={(newValue) => {
          // Determine which item was toggled by comparing old and new values
          const oldSet = state.expandedItems;
          const newSet = new Set(newValue as string[]);

          // Find added items
          for (const v of newSet) {
            if (!oldSet.has(v)) {
              actions.toggleItem(v);
              return;
            }
          }
          // Find removed items
          for (const v of oldSet) {
            if (!newSet.has(v)) {
              actions.toggleItem(v);
              return;
            }
          }
        }}
        multiple={meta.type === 'multiple'}
      >
        {children}
      </BaseAccordion.Root>
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
    <BaseAccordion.Item
      value={value}
      className={`
        border
        -mt-px first:mt-0
        ${className}
      `.trim()}
      data-slot="accordion-item"
      data-variant="accordion"
      data-state={isExpanded ? 'open' : 'closed'}
    >
      {children}
    </BaseAccordion.Item>
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
  const { state } = useAccordionContext();

  return (
    <BaseAccordion.Header render={<div />}>
      <BaseAccordion.Trigger
        render={(props) => {
          const isExpanded = props['aria-expanded'] === true || props['aria-expanded'] === 'true';
          return (
            <button
              {...props}
              type="button"
              className={`
                w-full flex items-center justify-between
                px-4 py-3
                font-heading text-sm uppercase tracking-tight leading-none text-content-primary
                bg-transparent
                hover:bg-hover-overlay
                transition-colors
                cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
                ${className}
              `.trim()}
            >
              <span>{children}</span>
              <span
                className="text-[1rem] font-sans select-none"
                aria-hidden="true"
              >
                {isExpanded ? '−' : '+'}
              </span>
            </button>
          );
        }}
      />
    </BaseAccordion.Header>
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
  return (
    <BaseAccordion.Panel
      className={`
        overflow-hidden
        ${className}
      `.trim()}
    >
      <div className="px-4 pb-4">
        {children}
      </div>
    </BaseAccordion.Panel>
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
