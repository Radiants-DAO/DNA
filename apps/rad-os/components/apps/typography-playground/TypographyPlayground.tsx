'use client';

import { SpecimenLayout } from './layouts/SpecimenLayout';
import { EditorialLayout } from './layouts/EditorialLayout';
import { UsageGuide } from './UsageGuide';

export type SubTab = 'manual' | 'editorial' | 'usage';

interface TypographyPlaygroundProps {
  activeSubTab: SubTab;
}

export function TypographyPlayground({
  activeSubTab,
}: TypographyPlaygroundProps) {
  if (activeSubTab === 'editorial') {
    return <EditorialLayout />;
  }
  if (activeSubTab === 'usage') {
    return <UsageGuide />;
  }

  return <SpecimenLayout />;
}
