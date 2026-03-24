'use client';

import React from 'react';
import { BroadsheetLayout } from './layouts/BroadsheetLayout';
import { MagazineLayout } from './layouts/MagazineLayout';
import { SpecimenLayout } from './layouts/SpecimenLayout';
import { UsageGuide } from './UsageGuide';
import { TypeStyles } from './TypeStyles';

export type SubTab = 'manual' | 'usage' | 'styles';
export type LayoutVariant = 'broadsheet' | 'magazine' | 'specimen';

interface TypographyPlaygroundProps {
  activeSubTab: SubTab;
  layoutVariant: LayoutVariant;
}

const LAYOUT_MAP: Record<LayoutVariant, React.ComponentType> = {
  broadsheet: BroadsheetLayout,
  magazine: MagazineLayout,
  specimen: SpecimenLayout,
};

export function TypographyPlayground({
  activeSubTab,
  layoutVariant,
}: TypographyPlaygroundProps) {
  if (activeSubTab === 'usage') {
    return <UsageGuide />;
  }

  if (activeSubTab === 'styles') {
    return <TypeStyles />;
  }

  // Default: manual sub-tab with active layout variant
  const LayoutComponent = LAYOUT_MAP[layoutVariant];
  return <LayoutComponent />;
}
