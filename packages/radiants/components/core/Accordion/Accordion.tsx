'use client';

import React, { createContext, use, useState, useCallback, useRef, useEffect } from 'react';

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

function useAccordionContext() {
  const context = use(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
}

function useAccordionItemContext() {
  const context = use(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger/AccordionContent must be used within an AccordionItem');
  }
  return context;
}

// ============================================================================
// Accordion Root
// ============================================================================

interface AccordionProps {
  /** Allow single or multiple items to be expanded at once */
  type?: AccordionType;
  /** Default expanded item(s) - string for single, array for multiple */
  defaultValue?: string | string[];
  /** Controlled expanded value(s) */
  value?: string | string[];
  /** Callback when expanded items change */
  onValueChange?: (value: string | string[]) => void;
  /** Additional className */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// AccordionProvider (state management only)
// ============================================================================

interface AccordionProviderProps {
  children: React.ReactNode;
  /** Accordion type */
  type?: AccordionType;
  /** Controlled expanded value(s) */
  value?: string | string[];
  /** Default expanded item(s) */
  defaultValue?: string | string[];
  /** Callback when expanded items change */
  onValueChange?: (value: string | string[]) => void;
}

function AccordionProvider({
  children,
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
}: AccordionProviderProps) {
  const getInitialExpanded = (): Set<string> => {
    const initial = controlledValue ?? defaultValue;
    if (!initial) return new Set();
    return new Set(Array.isArray(initial) ? initial : [initial]);
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(getInitialExpanded);

  // Sync with controlled value
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
        if (type === 'single') {
          next.clear();
        }
        next.add(itemValue);
      }

      if (onValueChange) {
        const newValue = Array.from(next);
        onValueChange(type === 'single' ? (newValue[0] ?? '') : newValue);
      }

      return next;
    });
  }, [type, onValueChange]);

  const contextValue: AccordionContextValue = {
    state: { expandedItems },
    actions: { toggleItem },
    meta: { type },
  };

  return (
    <AccordionContext value={contextValue}>
      {children}
    </AccordionContext>
  );
}

// ============================================================================
// AccordionFrame (structure only)
// ============================================================================

interface AccordionFrameProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionFrame({ children, className = '' }: AccordionFrameProps) {
  return <div className={`space-y-0 ${className}`}>{children}</div>;
}

// ============================================================================
// Accordion — Convenience wrapper combining Provider + Frame
// ============================================================================

/**
 * Accordion — Convenience wrapper combining Provider + Frame.
 * For full control, use Accordion.Provider + Accordion.Frame separately.
 */
export const Accordion = Object.assign(
  function Accordion({
    type = 'single',
    defaultValue,
    value,
    onValueChange,
    className = '',
    children,
  }: AccordionProps) {
    return (
      <AccordionProvider
        type={type}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        <AccordionFrame className={className}>
          {children}
        </AccordionFrame>
      </AccordionProvider>
    );
  },
  {
    Provider: AccordionProvider,
    Frame: AccordionFrame,
    Item: AccordionItem,
    Trigger: AccordionTrigger,
    Content: AccordionContent,
  }
);

// ============================================================================
// Accordion Item
// ============================================================================

interface AccordionItemProps {
  /** Unique value for this item */
  value: string;
  /** Additional className */
  className?: string;
  /** Children (AccordionTrigger and AccordionContent) */
  children: React.ReactNode;
}

export function AccordionItem({ value, className = '', children }: AccordionItemProps) {
  const { state } = useAccordionContext();
  const { expandedItems } = state;
  const isExpanded = expandedItems.has(value);

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
// Accordion Trigger
// ============================================================================

interface AccordionTriggerProps {
  /** Additional className */
  className?: string;
  /** Children (header content) */
  children: React.ReactNode;
}

export function AccordionTrigger({ className = '', children }: AccordionTriggerProps) {
  const { actions } = useAccordionContext();
  const { toggleItem } = actions;
  const { value, isExpanded } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
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
// Accordion Content
// ============================================================================

interface AccordionContentProps {
  /** Additional className */
  className?: string;
  /** Children (content) */
  children: React.ReactNode;
}

export function AccordionContent({ className = '', children }: AccordionContentProps) {
  const { isExpanded } = useAccordionItemContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (isExpanded) {
      // Expanding: measure content height and animate
      const scrollHeight = content.scrollHeight;
      setHeight(scrollHeight);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setHeight(undefined); // Remove fixed height after animation
      }, 200);

      return () => clearTimeout(timer);
    } else {
      // Collapsing: set current height first, then animate to 0
      const scrollHeight = content.scrollHeight;
      setHeight(scrollHeight);
      setIsAnimating(true);

      // Force reflow before setting height to 0
      requestAnimationFrame(() => {
        setHeight(0);
      });

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div
      ref={contentRef}
      className={`
        overflow-hidden
        transition-[height] duration-200 ease-out
        ${className}
      `.trim()}
      style={{
        height: isAnimating ? height : (isExpanded ? 'auto' : 0),
      }}
      aria-hidden={!isExpanded}
    >
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

export default Accordion;
