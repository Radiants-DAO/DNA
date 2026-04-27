'use client';

import { SpecimenLayout } from './layouts/SpecimenLayout';
import { EditorialLayout } from './layouts/EditorialLayout';

export type SubTab = 'manual' | 'editorial';

interface TypographyPlaygroundProps {
  activeSubTab: SubTab;
}

export function TypographyPlayground({
  activeSubTab,
}: TypographyPlaygroundProps) {
  if (activeSubTab === 'editorial') {
    return <EditorialLayout />;
  }

  return <SpecimenLayout />;
}
