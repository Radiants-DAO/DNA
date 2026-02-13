'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  type: AccordionType;
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
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
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
}

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger/AccordionContent must be used within an AccordionItem');
  }
  return context;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Base styles for accordion container
 */
const accordionBaseStyles = 'space-y-0';

/**
 * Base styles for accordion item
 */
const accordionItemBaseStyles = `
  border-b border-neutral-neutral-2
  first:border-t first:border-neutral-neutral-3
  bg-white
`;

/**
 * Base styles for accordion trigger button
 */
const accordionTriggerBaseStyles = `
  w-full flex items-center justify-between
  px-0 py-5
  font-alfacad text-2xl uppercase text-black
  bg-transparent
  hover:text-neutral-neutral-3
  cursor-pointer
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2
`;

/**
 * Styles for accordion trigger icon
 */
const accordionTriggerIconStyles = `
  size-8 flex items-center justify-center
  bg-black text-white text-xl font-bold select-none
`;

/**
 * Base styles for accordion content wrapper
 */
const accordionContentBaseStyles = `
  overflow-hidden
  transition-[height] ease-out
`;

/**
 * Styles for accordion content inner div
 */
const accordionContentInnerStyles = `
  pb-6 pr-48
`;

// ============================================================================
// Helper Functions
// ============================================================================

function getAccordionClasses(className: string): string {
  return [accordionBaseStyles, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAccordionItemClasses(className: string): string {
  return [accordionItemBaseStyles, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAccordionTriggerClasses(className: string): string {
  return [accordionTriggerBaseStyles, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAccordionContentClasses(className: string): string {
  return [accordionContentBaseStyles, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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

export function Accordion({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange,
  className = '',
  children,
}: AccordionProps) {
  // Initialize expanded items
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

      // Notify parent of change
      if (onValueChange) {
        const newValue = Array.from(next);
        onValueChange(type === 'single' ? (newValue[0] ?? '') : newValue);
      }

      return next;
    });
  }, [type, onValueChange]);

  return (
    <AccordionContext.Provider value={{ type, expandedItems, toggleItem }}>
      <div className={getAccordionClasses(className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

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
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.has(value);

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded }}>
      <div
        className={getAccordionItemClasses(className)}
        data-state={isExpanded ? 'open' : 'closed'}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
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
  const { toggleItem } = useAccordionContext();
  const { value, isExpanded } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={getAccordionTriggerClasses(className)}
      aria-expanded={isExpanded}
    >
      <span className="text-left">{children}</span>
      <span
        className={accordionTriggerIconStyles.trim()}
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measuredHeightRef = useRef<number>(0);

  useEffect(() => {
    const content = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!content || !wrapper) return;

    if (isExpanded) {
      // Expanding: measure content height
      // Use stored height if available, otherwise measure
      let targetHeight = measuredHeightRef.current;
      
      if (targetHeight === 0) {
        // Need to measure - temporarily allow expansion without transition
        const prevTransition = wrapper.style.transitionDuration;
        const prevHeight = wrapper.style.height;
        
        wrapper.style.transitionDuration = '0ms';
        wrapper.style.height = 'auto';
        wrapper.style.visibility = 'hidden';
        
        // Measure
        targetHeight = content.scrollHeight;
        measuredHeightRef.current = targetHeight;
        
        // Restore immediately
        wrapper.style.height = prevHeight || '0px';
        wrapper.style.visibility = '';
        wrapper.style.transitionDuration = prevTransition;
      }
      
      // Get current height (might be 0 if collapsed, or auto if already expanded)
      const currentHeight = wrapper.style.height === 'auto' 
        ? wrapper.offsetHeight 
        : wrapper.offsetHeight || 0;
      
      const calculatedDuration = Math.min(Math.max(200, 200 + Math.floor(targetHeight / 2)), 600);
      
      // Set up animation - always start from current and animate to target
      wrapper.style.transitionDuration = `${calculatedDuration}ms`;
      wrapper.style.height = `${currentHeight}px`;
      
      // Force reflow
      void wrapper.offsetHeight;
      
      // Animate to target
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          wrapper.style.height = `${targetHeight}px`;
        });
      });

      const timer = setTimeout(() => {
        wrapper.style.transitionDuration = '';
        wrapper.style.height = 'auto';
      }, calculatedDuration);

      return () => clearTimeout(timer);
    } else {
      // Collapsing: get current rendered height
      // If height is 'auto', we need to get the actual rendered height
      let currentHeight: number;
      
      if (wrapper.style.height === 'auto' || !wrapper.style.height) {
        // Currently expanded, get actual height
        currentHeight = wrapper.offsetHeight;
        // Store it for next time
        if (currentHeight > 0) {
          measuredHeightRef.current = currentHeight;
        }
      } else {
        // Already has explicit height
        currentHeight = wrapper.offsetHeight || measuredHeightRef.current;
      }
      
      if (currentHeight <= 0) {
        wrapper.style.height = '0px';
        wrapper.style.transitionDuration = '';
        return;
      }
      
      const calculatedDuration = Math.min(Math.max(200, 200 + Math.floor(currentHeight / 2)), 600);
      
      // Ensure we start from the current height
      wrapper.style.transitionDuration = `${calculatedDuration}ms`;
      wrapper.style.height = `${currentHeight}px`;
      
      // Force reflow
      void wrapper.offsetHeight;
      
      // Animate to 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          wrapper.style.height = '0px';
        });
      });

      const timer = setTimeout(() => {
        wrapper.style.transitionDuration = '';
        wrapper.style.height = '0px';
      }, calculatedDuration);

      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div
      ref={wrapperRef}
      className={getAccordionContentClasses(className)}
      style={{
        height: isExpanded ? 'auto' : '0px',
      }}
      aria-hidden={!isExpanded}
    >
      <div ref={contentRef} className={accordionContentInnerStyles.trim()}>
        {children}
      </div>
    </div>
  );
}

export default Accordion;
