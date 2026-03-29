'use client';

import { SpecimenLayout } from './layouts/SpecimenLayout';
import { UsageGuide } from './UsageGuide';

export type SubTab = 'manual' | 'usage';

interface TypographyPlaygroundProps {
  activeSubTab: SubTab;
}

export function TypographyPlayground({
  activeSubTab,
}: TypographyPlaygroundProps) {
  if (activeSubTab === 'usage') {
    return <UsageGuide />;
  }

  return <SpecimenLayout />;
}
