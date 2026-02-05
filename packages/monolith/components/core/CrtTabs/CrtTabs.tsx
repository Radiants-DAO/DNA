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
  return <Tabs.List className={`crt-tab-list ${className}`}>{children}</Tabs.List>;
}

function CrtTabsTrigger({ value, children, className = '' }: CrtTabsTriggerProps) {
  return (
    <Tabs.Trigger value={value} className={`crt-tab-trigger ${className}`}>
      {children}
    </Tabs.Trigger>
  );
}

function CrtTabsContent({ value, children, className = '' }: CrtTabsContentProps) {
  return (
    <Tabs.Content value={value} className={`crt-tab-content ${className}`}>
      {children}
    </Tabs.Content>
  );
}

CrtTabs.List = CrtTabsList;
CrtTabs.Trigger = CrtTabsTrigger;
CrtTabs.Content = CrtTabsContent;

export default CrtTabs;
