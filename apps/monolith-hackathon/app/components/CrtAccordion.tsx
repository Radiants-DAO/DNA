'use client';

import React, { createContext, use, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
  type: AccordionType;
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
  if (!context) throw new Error('CrtAccordion components must be used within a CrtAccordion');
  return context;
}

function useAccordionItemContext() {
  const context = use(AccordionItemContext);
  if (!context) throw new Error('CrtAccordion.Trigger/Content must be used within CrtAccordion.Item');
  return context;
}

// ============================================================================
// Root
// ============================================================================

interface CrtAccordionProps {
  type?: AccordionType;
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

export function CrtAccordion({
  type = 'single',
  defaultValue,
  children,
  className = '',
}: CrtAccordionProps) {
  const getInitial = (): Set<string> => {
    if (!defaultValue) return new Set();
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(getInitial);

  const toggleItem = useCallback((itemValue: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemValue)) {
        next.delete(itemValue);
      } else {
        if (type === 'single') next.clear();
        next.add(itemValue);
      }
      return next;
    });
  }, [type]);

  return (
    <AccordionContext value={{ expandedItems, toggleItem, type }}>
      <div className={className}>{children}</div>
    </AccordionContext>
  );
}

// ============================================================================
// Item
// ============================================================================

interface CrtAccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

function CrtAccordionItem({ value, className = '', children }: CrtAccordionItemProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.has(value);

  return (
    <AccordionItemContext value={{ value, isExpanded }}>
      <div
        className={`crt-accordion-item ${className}`}
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

interface CrtAccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

function CrtAccordionTrigger({ className = '', children }: CrtAccordionTriggerProps) {
  const { toggleItem } = useAccordionContext();
  const { value, isExpanded } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={`crt-accordion-trigger ${className}`}
      aria-expanded={isExpanded}
    >
      <span>{children}</span>
      <span aria-hidden="true">{isExpanded ? '\u2212' : '+'}</span>
    </button>
  );
}

// ============================================================================
// Content
// ============================================================================

interface CrtAccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

function CrtAccordionContent({ className = '', children }: CrtAccordionContentProps) {
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
      requestAnimationFrame(() => setHeight(0));
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div
      ref={contentRef}
      style={{
        overflow: 'hidden',
        transition: 'height 200ms ease-out',
        height: isAnimating ? height : (isExpanded ? 'auto' : 0),
      }}
      aria-hidden={!isExpanded}
    >
      <div className={`crt-accordion-content ${className}`}>
        {children}
      </div>
    </div>
  );
}

// Attach sub-components
CrtAccordion.Item = CrtAccordionItem;
CrtAccordion.Trigger = CrtAccordionTrigger;
CrtAccordion.Content = CrtAccordionContent;

export default CrtAccordion;
