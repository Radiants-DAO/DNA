'use client';

import * as Accordion from '@radix-ui/react-accordion';
import React from 'react';

export interface CrtAccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface CrtAccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface CrtAccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface CrtAccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CrtAccordion({ type = 'single', defaultValue, collapsible = true, className = '', children }: CrtAccordionProps) {
  return (
    <Accordion.Root
      type={type}
      defaultValue={type === 'single' ? (defaultValue as string | undefined) : (defaultValue as string[] | undefined)}
      collapsible={type === 'single' ? collapsible : undefined}
      className={`flex flex-col gap-[0.5em] ${className}`}
    >
      {children}
    </Accordion.Root>
  );
}

function CrtAccordionItem({ value, children, className = '' }: CrtAccordionItemProps) {
  return (
    <Accordion.Item
      value={value}
      className={[
        // Base
        'border border-[rgba(180,148,247,0.8)] border-b-[var(--color-bevel-shadow)] border-r-[var(--color-bevel-shadow)]',
        'bg-[var(--panel-accent-08)]',
        'transition-[background,border-color,box-shadow,transform] duration-200 ease-[var(--easing-drift)]',
        // Hover — lift + glow
        'hover:bg-[rgba(105,57,202,0.15)] hover:border-[rgba(180,148,247,1)]',
        'hover:border-b-black hover:border-r-black',
        'hover:shadow-[0_0_0.6em_rgba(105,57,202,0.4)] hover:-translate-y-px',
        // Active — press
        'active:bg-[rgba(105,57,202,0.08)] active:translate-y-px',
        'active:border-[var(--color-bevel-shadow)] active:border-b-[rgba(180,148,247,0.8)] active:border-r-[rgba(180,148,247,0.8)]',
        'active:shadow-[inset_0_0_0.4em_rgba(105,57,202,0.3)]',
        // Open state
        'data-[state=open]:bg-[var(--panel-accent-15)] data-[state=open]:border-l-2 data-[state=open]:border-l-[var(--panel-accent)]',
        // Cancel hover/active transform when open
        'data-[state=open]:hover:transform-none data-[state=open]:active:transform-none',
        className,
      ].join(' ')}
    >
      {children}
    </Accordion.Item>
  );
}

function CrtAccordionTrigger({ children, className = '' }: CrtAccordionTriggerProps) {
  return (
    <Accordion.Header>
      <Accordion.Trigger
        className={[
          // Layout
          'group w-full flex items-center justify-between text-left',
          'px-[1em] py-[0.75em]',
          // Typography
          'font-mono text-[0.875em] uppercase tracking-[0.05em]',
          // Colors
          'text-white bg-transparent border-none cursor-pointer',
          'transition-colors duration-200 ease-[var(--easing-drift)]',
          // Hover
          'hover:text-[var(--panel-accent)]',
          // Open state — trigger text glow
          'data-[state=open]:text-[var(--panel-accent)] data-[state=open]:[text-shadow:0_0_0.4em_var(--panel-accent-30)]',
          className,
        ].join(' ')}
      >
        <span className="flex items-center gap-[0.5em]">
          {children}
        </span>
        <svg
          width={12}
          height={12}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          className={[
            'text-[1.25em] text-[var(--panel-accent-65)]',
            'transition-transform duration-200 ease-[var(--easing-drift)]',
            'group-data-[state=open]:rotate-45',
          ].join(' ')}
        >
          <path d="M7,4H9V7H12V9H9V12H7V9H4V7H7V4Z" />
        </svg>
      </Accordion.Trigger>
    </Accordion.Header>
  );
}

function CrtAccordionContent({ children, className = '' }: CrtAccordionContentProps) {
  return (
    <Accordion.Content
      className={[
        'px-[1em] pb-[1em] pt-[0.75em] mx-[0.5em]',
        'font-body text-[0.9375em] leading-[1.6] text-white text-left',
        'border-t border-[var(--panel-accent-15)]',
        'data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
        className,
      ].join(' ')}
    >
      {children}
    </Accordion.Content>
  );
}

CrtAccordion.Item = CrtAccordionItem;
CrtAccordion.Trigger = CrtAccordionTrigger;
CrtAccordion.Content = CrtAccordionContent;

export default CrtAccordion;
