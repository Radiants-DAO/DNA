'use client';

import { useEffect } from 'react';
import { AppWindow } from '../components/AppWindow';
import ComponentLibraryContent from '../components/panels/ComponentLibraryContent';
import { useWindowManager } from '../hooks/useWindowManager';

// ============================================================================
// Main Component
// ============================================================================

export default function DesignSystemShowcase() {
  const { openWindow } = useWindowManager();

  useEffect(() => {
    openWindow('component-library', { width: 800, height: 600 });
  }, [openWindow]);

  return (
    <div
      className="relative w-screen h-screen bg-[var(--color-surface-body)] text-white"
      style={{
        '--panel-accent': '#b494f7',
        '--panel-accent-65': 'rgba(180, 148, 247, 0.65)',
        '--panel-accent-50': 'rgba(180, 148, 247, 0.5)',
        '--panel-accent-40': 'rgba(180, 148, 247, 0.4)',
        '--panel-accent-30': 'rgba(180, 148, 247, 0.3)',
        '--panel-accent-20': 'rgba(180, 148, 247, 0.2)',
        '--panel-accent-15': 'rgba(180, 148, 247, 0.15)',
        '--panel-accent-08': 'rgba(180, 148, 247, 0.08)',
      } as React.CSSProperties}
    >
      <AppWindow
        id="component-library"
        title="COMPONENTS.EXE"
        defaultSize={{ width: 800, height: 600 }}
        resizable
      >
        <ComponentLibraryContent />
      </AppWindow>
    </div>
  );
}
