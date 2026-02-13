'use client';

import * as Tabs from '@radix-ui/react-tabs';
import React from 'react';

export interface CrtTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface CrtTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface CrtTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface CrtTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function CrtTabs({ defaultValue, value, onValueChange, children, className = '' }: CrtTabsProps) {
  return (
    <Tabs.Root defaultValue={defaultValue} value={value} onValueChange={onValueChange} className={className}>
      {children}
    </Tabs.Root>
  );
}

function CrtTabsList({ children, className = '' }: CrtTabsListProps) {
  return (
    <Tabs.List
      className={`flex gap-[0.375em] px-[0.75em] py-[0.5em] border-b border-[var(--panel-accent-15)] ${className}`}
    >
      {children}
    </Tabs.List>
  );
}

function CrtTabsTrigger({ value, children, className = '' }: CrtTabsTriggerProps) {
  return (
    <Tabs.Trigger
      value={value}
      className={[
        // Base
        'px-[0.75em] py-[0.5em] font-mono text-[0.75em] uppercase tracking-[0.05em]',
        'text-white/50 bg-[var(--panel-accent-08)] cursor-pointer',
        // Beveled border
        'border border-[rgba(180,148,247,0.8)] border-b-[var(--color-bevel-shadow)] border-r-[var(--color-bevel-shadow)]',
        // Transitions
        'transition-[color,background-color,border-color,text-shadow,transform] duration-200 ease-[var(--easing-drift)]',
        // Hover
        'hover:text-[var(--panel-accent)] hover:bg-[rgba(105,57,202,0.3)]',
        'hover:border-[rgba(180,148,247,1)] hover:border-b-black hover:border-r-black',
        'hover:shadow-[0_0_0.6em_rgba(105,57,202,0.5)] hover:[text-shadow:0_0_0.4em_var(--panel-accent-30)]',
        'hover:-translate-y-px',
        // Active (pressed)
        'active:bg-[rgba(105,57,202,0.15)] active:translate-y-px',
        'active:border-[var(--color-bevel-shadow)] active:border-b-[rgba(180,148,247,0.8)] active:border-r-[rgba(180,148,247,0.8)]',
        'active:shadow-[inset_0_0_0.4em_rgba(105,57,202,0.3)]',
        // Active tab (Radix data-state)
        'data-[state=active]:text-[var(--panel-accent)] data-[state=active]:bg-[var(--panel-accent-15)]',
        'data-[state=active]:border-l-2 data-[state=active]:border-l-[var(--panel-accent)]',
        'data-[state=active]:[text-shadow:0_0_0.4em_var(--panel-accent-30)]',
        className,
      ].join(' ')}
    >
      {children}
    </Tabs.Trigger>
  );
}

function CrtTabsContent({ value, children, className = '' }: CrtTabsContentProps) {
  return (
    <Tabs.Content value={value} className={`pt-[0.5em] ${className}`}>
      {children}
    </Tabs.Content>
  );
}

CrtTabs.List = CrtTabsList;
CrtTabs.Trigger = CrtTabsTrigger;
CrtTabs.Content = CrtTabsContent;

export default CrtTabs;
