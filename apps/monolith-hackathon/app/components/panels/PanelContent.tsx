'use client';

import { CONTENT, renderContent, useSequentialReveal } from '../InfoWindow';

interface PanelContentProps {
  panelId: string;
  initialTab?: string | null;
  activeSubTab?: string | null;
  setActiveSubTab?: (tab: string) => void;
}

export default function PanelContent({ panelId, initialTab, activeSubTab, setActiveSubTab }: PanelContentProps) {
  const data = CONTENT[panelId];
  const { revealed, advance } = useSequentialReveal();

  if (!data) return null;

  return <>{renderContent(data, revealed, advance, initialTab, activeSubTab, setActiveSubTab)}</>;
}
