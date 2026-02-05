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
      className={className}
    >
      {children}
    </Accordion.Root>
  );
}

function CrtAccordionItem({ value, children, className = '' }: CrtAccordionItemProps) {
  return <Accordion.Item value={value} className={`crt-accordion-item ${className}`}>{children}</Accordion.Item>;
}

function CrtAccordionTrigger({ children, className = '' }: CrtAccordionTriggerProps) {
  return (
    <Accordion.Header>
      <Accordion.Trigger className={`crt-accordion-trigger ${className}`}>
        {children}
        <svg width={12} height={12} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7,4H9V7H12V9H9V12H7V9H4V7H7V4Z" />
        </svg>
      </Accordion.Trigger>
    </Accordion.Header>
  );
}

function CrtAccordionContent({ children, className = '' }: CrtAccordionContentProps) {
  return (
    <Accordion.Content className={`crt-accordion-content data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up ${className}`}>
      {children}
    </Accordion.Content>
  );
}

CrtAccordion.Item = CrtAccordionItem;
CrtAccordion.Trigger = CrtAccordionTrigger;
CrtAccordion.Content = CrtAccordionContent;

export default CrtAccordion;
