'use client';

import type { ReactNode } from 'react';
import { Section } from '@rdna/ctrl';

interface StudioRailSectionProps {
  children: ReactNode;
  className?: string;
}

interface StudioRailDropdownProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerControls?: ReactNode;
  collapsedIcon?: ReactNode;
  collapsedTooltip?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function StudioRailSection({
  children,
  className = '',
}: StudioRailSectionProps) {
  return (
    <section
      data-rdna="studio-rail-section"
      className={[
        'relative flex min-w-0 flex-col bg-ink',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  );
}

export function StudioRailDropdown({
  title,
  children,
  defaultOpen,
  headerControls,
  collapsedIcon,
  collapsedTooltip,
  className = '',
  contentClassName = '',
}: StudioRailDropdownProps) {
  return (
    <Section
      title={title}
      defaultOpen={defaultOpen}
      simpleHeader
      showCollapseLabel={false}
      showCollapseIcon={false}
      collapsedIcon={collapsedIcon}
      collapsedTooltip={collapsedTooltip ?? title}
      headerClassName="bg-ctrl-cell-bg"
      titleClassName="text-xs font-bold tracking-wider"
      contentClassName={['!p-px !gap-px', contentClassName]
        .filter(Boolean)
        .join(' ')}
      headerControls={headerControls}
      className={className}
    >
      {children}
    </Section>
  );
}
